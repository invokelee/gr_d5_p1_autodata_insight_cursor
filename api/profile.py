"""Vercel serverless: dataset profiling."""

from __future__ import annotations

import os
from http.server import BaseHTTPRequestHandler

import pandas as pd

from _lib import (
    coerce_unknown_missing,
    guess_target_candidate,
    is_id_like,
    load_df,
    read_json_body,
    send_json,
)


def _profile_dataframe(df: pd.DataFrame) -> dict:
    df = coerce_unknown_missing(df)
    row_count = int(len(df))
    column_count = int(len(df.columns))
    columns = [str(c) for c in df.columns]

    dtypes = []
    dtype_groups: dict[str, int] = {}
    for c in df.columns:
        t = str(df[c].dtype)
        dtypes.append({"column": str(c), "dtype": t})
        dtype_groups[t] = dtype_groups.get(t, 0) + 1

    missing = []
    for c in df.columns:
        n = int(df[c].isna().sum())
        pct = float(n / row_count) if row_count else 0.0
        missing.append({"column": str(c), "count": n, "pct": round(pct, 6)})

    numeric_summary = []
    categorical_summary = []
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_numeric_dtype(s) and not is_id_like(s):
            ss = s.dropna()
            if len(ss) == 0:
                continue
            numeric_summary.append(
                {
                    "column": str(c),
                    "mean": float(ss.mean()),
                    "std": float(ss.std(ddof=0)) if len(ss) > 1 else 0.0,
                    "min": float(ss.min()),
                    "q25": float(ss.quantile(0.25)),
                    "q50": float(ss.median()),
                    "q75": float(ss.quantile(0.75)),
                    "max": float(ss.max()),
                }
            )
        else:
            ss = s.dropna()
            if len(ss) == 0:
                uniq = 0
                top5 = []
            else:
                uniq = int(ss.nunique(dropna=True))
                vc = ss.astype(str).value_counts().head(5)
                top5 = [{"value": str(i), "count": int(v)} for i, v in vc.items()]
            categorical_summary.append(
                {
                    "column": str(c),
                    "unique": uniq,
                    "top5": top5,
                }
            )

    target_candidate = guess_target_candidate(columns)
    return {
        "rowCount": row_count,
        "columnCount": column_count,
        "columns": columns,
        "dtypes": dtypes,
        "dtypeGroups": dtype_groups,
        "missing": missing,
        "numericSummary": numeric_summary,
        "categoricalSummary": categorical_summary,
        "targetCandidate": target_candidate,
        "limits": {
            "maxUploadBytes": int(os.environ.get("MAX_UPLOAD_BYTES", str(4_500_000))),
        },
    }


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        from _lib import cors_headers

        cors_headers(self)
        self.end_headers()

    def do_POST(self) -> None:  # noqa: N802
        try:
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
            payload = _profile_dataframe(df)
            send_json(self, 200, payload)
        except ValueError as e:
            send_json(self, 400, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            send_json(self, 500, {"error": "profile_failed", "detail": str(e)})

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return
