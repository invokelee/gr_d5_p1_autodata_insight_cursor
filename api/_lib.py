"""Shared helpers for Vercel Python serverless handlers."""

from __future__ import annotations

import json
import math
from http.server import BaseHTTPRequestHandler
from io import StringIO
from typing import Any

import numpy as np
import pandas as pd


def cors_headers(handler: BaseHTTPRequestHandler) -> None:
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")


def read_json_body(handler: BaseHTTPRequestHandler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length") or "0")
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError as e:
        raise ValueError(f"invalid_json: {e}") from e


def json_safe(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {str(k): json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [json_safe(x) for x in obj]
    if isinstance(obj, (np.generic,)):
        return json_safe(obj.item())
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if obj is pd.NA:
        return None
    try:
        if pd.isna(obj):
            return None
    except TypeError:
        pass
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    return obj


def send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(json_safe(payload), ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    cors_headers(handler)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def load_df(csv_text: str) -> pd.DataFrame:
    if not csv_text or not csv_text.strip():
        raise ValueError("empty_csv")
    return pd.read_csv(StringIO(csv_text), low_memory=False)


def coerce_unknown_missing(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    unknown = {"", "nan", "none", "null", "na", "n/a", "unknown", "unk"}
    for c in out.columns:
        s = out[c]
        if not (pd.api.types.is_object_dtype(s) or str(s.dtype) == "string"):
            continue
        lc = s.astype(str).str.strip().str.lower()
        out.loc[lc.isin(unknown), c] = np.nan
    return out


def guess_target_candidate(columns: list[str]) -> str | None:
    for name in columns:
        if str(name).lower() in {"y", "target", "label"}:
            return str(name)
    return None


def is_id_like(series: pd.Series) -> bool:
    n = len(series.dropna())
    if n <= 1:
        return True
    if series.dtype == object:
        try:
            as_num = pd.to_numeric(series, errors="coerce")
            if as_num.notna().sum() / max(n, 1) > 0.95 and as_num.nunique(dropna=True) == as_num.notna().sum():
                return True
        except Exception:
            pass
    if pd.api.types.is_numeric_dtype(series) and series.nunique(dropna=True) == n:
        return True
    return False
