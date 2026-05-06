"""Vercel serverless: LLM narrative insights from profile + EDA."""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler
from typing import Any

_API_DIR = os.path.dirname(os.path.abspath(__file__))
if _API_DIR not in sys.path:
    sys.path.insert(0, _API_DIR)

from openai import OpenAI

from _lib import read_json_body, send_json


def _condense_bundle(profile: dict[str, Any], eda: dict[str, Any], dataset_name: str | None) -> dict[str, Any]:
    missing = sorted(profile.get("missing", []), key=lambda x: float(x.get("pct", 0)), reverse=True)[:15]
    num = profile.get("numericSummary", [])[:12]
    cat = profile.get("categoricalSummary", [])[:10]
    return {
        "datasetName": dataset_name,
        "rows": profile.get("rowCount"),
        "cols": profile.get("columnCount"),
        "targetCandidate": profile.get("targetCandidate"),
        "dtypeGroups": profile.get("dtypeGroups"),
        "topMissing": missing,
        "numericSample": num,
        "categoricalSample": cat,
        "edaMeta": eda.get("meta"),
        "histColumns": [h.get("column") for h in eda.get("histograms", [])],
        "topBarColumns": [b.get("column") for b in eda.get("topBars", [])],
        "scatterPairs": [
            {"x": s.get("x"), "y": s.get("y"), "sampleSize": len(s.get("points", []) or [])}
            for s in eda.get("scatter", [])
        ],
        "binaryCount": len(eda.get("binaryStack", [])),
        "hasCorrelationHeatmap": bool(eda.get("correlation", {}).get("columns")),
        "targetDistPresent": bool(eda.get("targetDist")),
        "lineSeriesMeta": [
            {
                "column": x.get("column"),
                "metric": x.get("metric"),
                "dailyBuckets": len(x.get("times", []) or []),
            }
            for x in eda.get("lineSeries", [])
        ],
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        from _lib import cors_headers

        cors_headers(self)
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        try:
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                send_json(self, 500, {"error": "missing_openai_api_key"})
                return

            body = read_json_body(self)
            profile = body.get("profile")
            eda = body.get("eda")
            if not isinstance(profile, dict) or not isinstance(eda, dict):
                send_json(self, 400, {"error": "profile_and_eda_required"})
                return
            dataset_name = body.get("datasetName")
            if dataset_name is not None and not isinstance(dataset_name, str):
                dataset_name = None

            bundle = _condense_bundle(profile, eda, dataset_name)
            model = os.environ.get("OPENAI_MODEL", "gpt-5-mini")

            instructions = """너는 탐색 데이터 분석(EDA) 결과를 받아 숙련 데이터 과학자이자 비즈니스 컨설턴트처럼 설명한다.
반드시 JSON 한 객체만 출력한다.
스키마:
{\"highlights\": [\"…\", \"…\", \"…\"], \"anomalies\": [\"…\", \"…\"], \"actions\": [\"…\", \"…\"]}
- highlights: 데이터의 세 가지 핵심 특징을 한글 한 문장씩.
- anomalies: 주목할 이상치·결측·분포 꼬리·불균형 등 데이터 품질/패턴 리스크(근거 포함, 없으면 빈 배열 피하지 말고 일반적인 주의점 1줄이라도 작성).
- actions: 검증 또는 후속 행동(예: 추가 수집, 특성 공학, 모델 검증 플랜)을 우선순위 있는 한 줄 항목으로.
근거 없는 과장 금지. 숫자는 요약값에 근거해 언급."""

            payload_text = json.dumps(bundle, ensure_ascii=False)
            client = OpenAI(api_key=api_key)

            kwargs: dict[str, Any] = {
                "model": model,
                "messages": [
                    {"role": "system", "content": instructions},
                    {
                        "role": "user",
                        "content": f"요약 입력 JSON:\n{payload_text}",
                    },
                ],
            }

            # JSON mode when supported; ignore failure on older models via second pass.
            try:
                kwargs["response_format"] = {"type": "json_object"}
                completion = client.chat.completions.create(**kwargs)
            except Exception:  # noqa: BLE001
                kwargs.pop("response_format", None)
                completion = client.chat.completions.create(**kwargs)

            text = (completion.choices[0].message.content or "").strip()
            if text.startswith("```"):
                lines = [ln for ln in text.splitlines() if not ln.strip().startswith("```")]
                text = "\n".join(lines).strip()
            parsed = json.loads(text)
            highlights = parsed.get("highlights")
            anomalies = parsed.get("anomalies")
            actions = parsed.get("actions")
            if not isinstance(highlights, list):
                highlights = [str(parsed.get("highlights", ""))]
            if not isinstance(anomalies, list):
                anomalies = [str(parsed.get("anomalies", ""))]
            if not isinstance(actions, list):
                actions = [str(parsed.get("actions", ""))]

            send_json(
                self,
                200,
                {
                    "highlights": [str(x) for x in highlights][:6],
                    "anomalies": [str(x) for x in anomalies][:12],
                    "actions": [str(x) for x in actions][:12],
                    "model": model,
                },
            )
        except json.JSONDecodeError as e:
            send_json(self, 502, {"error": "llm_json_parse_failed", "detail": str(e)})
        except ValueError as e:
            send_json(self, 400, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            send_json(self, 502, {"error": "insights_failed", "detail": str(e)})

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return
