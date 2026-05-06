"""Local dev API server without vercel login.

Run:
  python3 api/local_dev_server.py
"""

from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

from _lib import load_df, read_json_body, send_json
from eda import _build_eda
from insights import _condense_bundle
from openai import OpenAI
from profile import _profile_dataframe


class DevHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _dispatch(self) -> None:
        if self.path == "/api/profile":
            self._profile()
            return
        if self.path == "/api/eda":
            self._eda()
            return
        if self.path == "/api/insights":
            self._insights()
            return
        send_json(self, 404, {"error": "not_found", "path": self.path})

    def do_POST(self) -> None:  # noqa: N802
        try:
            self._dispatch()
        except Exception as e:  # noqa: BLE001
            send_json(self, 500, {"error": "dev_server_failed", "detail": str(e)})

    def _profile(self) -> None:
        body = read_json_body(self)
        csv_text = body.get("csv")
        if not isinstance(csv_text, str):
            send_json(self, 400, {"error": "csv_required_string"})
            return
        max_bytes = int(os.environ.get("MAX_UPLOAD_BYTES", str(4_500_000)))
        if len(csv_text.encode("utf-8")) > max_bytes:
            send_json(self, 413, {"error": "payload_too_large", "maxBytes": max_bytes})
            return
        df = load_df(csv_text)
        send_json(self, 200, _profile_dataframe(df))

    def _eda(self) -> None:
        body = read_json_body(self)
        csv_text = body.get("csv")
        target = body.get("target")
        if not isinstance(csv_text, str):
            send_json(self, 400, {"error": "csv_required_string"})
            return
        if target is not None and not isinstance(target, str):
            send_json(self, 400, {"error": "target_invalid"})
            return
        df = load_df(csv_text)
        if target and target not in df.columns:
            send_json(self, 400, {"error": "target_not_found", "target": target})
            return
        send_json(self, 200, _build_eda(df, target))

    def _insights(self) -> None:
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
{"highlights": ["…", "…", "…"], "anomalies": ["…", "…"], "actions": ["…", "…"]}"""
        payload_text = json.dumps(bundle, ensure_ascii=False)
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": instructions},
                {"role": "user", "content": f"요약 입력 JSON:\n{payload_text}"},
            ],
        )
        text = (completion.choices[0].message.content or "").strip()
        if text.startswith("```"):
            lines = [ln for ln in text.splitlines() if not ln.strip().startswith("```")]
            text = "\n".join(lines).strip()
        parsed: dict[str, Any] = json.loads(text)
        send_json(
            self,
            200,
            {
                "highlights": [str(x) for x in parsed.get("highlights", [])][:6],
                "anomalies": [str(x) for x in parsed.get("anomalies", [])][:12],
                "actions": [str(x) for x in parsed.get("actions", [])][:12],
                "model": model,
            },
        )

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


def main() -> None:
    port = int(os.environ.get("DEV_API_PORT", "3000"))
    server = HTTPServer(("0.0.0.0", port), DevHandler)
    print(f"[local-dev-api] listening on http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
