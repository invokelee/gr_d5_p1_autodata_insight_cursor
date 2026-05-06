"""Vercel serverless: chart-oriented EDA aggregations."""

from __future__ import annotations

import os
from http.server import BaseHTTPRequestHandler

import numpy as np
import pandas as pd

from _lib import (
    coerce_unknown_missing,
    is_id_like,
    load_df,
    read_json_body,
    send_json,
)


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except ValueError:
        return default


def _pick_numeric_cols(df: pd.DataFrame, exclude: set[str], max_cols: int) -> list[str]:
    cols = []
    for c in df.columns:
        if str(c) in exclude:
            continue
        s = df[c]
        if pd.api.types.is_numeric_dtype(s) and not is_id_like(s):
            cols.append(str(c))
    # variance priority
    scores: list[tuple[float, str]] = []
    for c in cols:
        v = df[c].dropna()
        if len(v) < 2:
            continue
        scores.append((float(v.std(ddof=0)), c))
    scores.sort(reverse=True)
    return [c for _, c in scores[:max_cols]]


def _pick_categorical_cols(df: pd.DataFrame, exclude: set[str], max_cols: int) -> list[str]:
    picked: list[str] = []
    for c in df.columns:
        if str(c) in exclude:
            continue
        s = df[c].dropna()
        if len(s) == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[c]) and not is_id_like(df[c]):
            continue
        u = int(s.nunique())
        if u <= 1 or u > 40:
            continue
        picked.append((u, str(c)))
    picked.sort(key=lambda x: x[0])
    return [c for _, c in picked[:max_cols]]


def _binary_columns(df: pd.DataFrame, max_cols: int) -> list[str]:
    out: list[str] = []
    for c in df.columns:
        s = pd.to_numeric(df[c], errors="coerce").dropna()
        if len(s) == 0:
            continue
        vals = np.unique(np.round(s.to_numpy(dtype=float), 6))
        if len(vals) > 2:
            continue
        if not np.all(np.isin(vals, np.array([0.0, 1.0]))):
            continue
        out.append(str(c))
    return out[:max_cols]


def _datetime_columns(df: pd.DataFrame, max_cols: int) -> list[str]:
    found: list[str] = []
    for c in df.columns:
        s = df[c]
        if pd.api.types.is_datetime64_any_dtype(s):
            found.append(str(c))
            continue
        if pd.api.types.is_numeric_dtype(s):
            continue
        parsed = pd.to_datetime(s, errors="coerce", utc=False)
        if parsed.notna().sum() / max(len(s), 1) > 0.55:
            found.append(str(c))
    return found[:max_cols]


def _build_eda(df: pd.DataFrame, target: str | None) -> dict:
    df = coerce_unknown_missing(df)
    max_feat = _env_int("EDA_MAX_COLUMNS", 80)
    numeric_pool = max_feat

    exclude: set[str] = set()
    if target and target in df.columns:
        exclude.add(target)

    num_cols = _pick_numeric_cols(df, exclude | set(), numeric_pool)
    cat_cols = _pick_categorical_cols(df, exclude | set(), 8)

    histograms = []
    for c in num_cols[:6]:
        s = pd.to_numeric(df[c], errors="coerce").dropna()
        if len(s) < 2:
            continue
        counts, bins = np.histogram(s.values, bins=min(40, max(10, int(np.sqrt(len(s))))))
        histograms.append(
            {
                "column": c,
                "bins": [float(round(x, 8)) for x in bins[:-1]],
                "counts": [int(x) for x in counts.tolist()],
            }
        )

    top_bars = []
    pies = []
    for c in cat_cols[:6]:
        s = df[c].astype(str).replace({"nan": "(missing)"})
        vc = s.value_counts().head(12)
        items = [{"label": str(i), "count": int(v)} for i, v in vc.items()]
        top_bars.append({"column": c, "items": items})
        if len(items) <= 6:
            pies.append({"column": c, "items": items})

    target_dist = None
    line_series = []
    scatter = []

    if target and target in df.columns:
        y = pd.to_numeric(df[target], errors="coerce")
        if y.notna().sum() > 1:
            s = y.dropna()
            counts, bins = np.histogram(s.values, bins=min(50, max(10, int(np.sqrt(len(s))))))
            target_dist = {
                "column": target,
                "sortedIndex": {
                    "x": list(range(int(len(s)))),
                    "y": [float(v) for v in np.sort(s.values)],
                },
                "bins": [float(round(x, 8)) for x in bins[:-1]],
                "counts": [int(x) for x in counts.tolist()],
            }
        # scatter vs top correlated numerics
        corrs: list[tuple[float, str]] = []
        for c in num_cols:
            if c == target:
                continue
            x = pd.to_numeric(df[c], errors="coerce")
            pair = pd.concat([x, y], axis=1).dropna()
            if len(pair) < 5:
                continue
            r = float(pair.iloc[:, 0].corr(pair.iloc[:, 1]))
            if not np.isnan(r):
                corrs.append((abs(r), c))
        corrs.sort(reverse=True)
        for _, c in corrs[:2]:
            pair = pd.concat([pd.to_numeric(df[c], errors="coerce"), y], axis=1).dropna()
            if len(pair) > 5000:
                pair = pair.sample(5000, random_state=42)
            scatter.append(
                {
                    "x": c,
                    "y": target,
                    "points": [[float(a), float(b)] for a, b in pair.itertuples(index=False)],
                }
            )
    else:
        # no target: scatter first two high-variance numerics
        if len(num_cols) >= 2:
            pair = pd.concat(
                [
                    pd.to_numeric(df[num_cols[0]], errors="coerce"),
                    pd.to_numeric(df[num_cols[1]], errors="coerce"),
                ],
                axis=1,
            ).dropna()
            if len(pair) > 5000:
                pair = pair.sample(5000, random_state=42)
            if len(pair) >= 5:
                scatter.append(
                    {
                        "x": num_cols[0],
                        "y": num_cols[1],
                        "points": [[float(a), float(b)] for a, b in pair.itertuples(index=False)],
                    }
                )

    binary_stack = []
    for c in _binary_columns(df, 24):
        b = pd.to_numeric(df[c], errors="coerce")
        valid = b.notna() & b.isin([0, 1])
        z = int((b[valid] == 0).sum())
        o = int((b[valid] == 1).sum())
        if z + o == 0:
            continue
        entry: dict = {"column": c, "zero": z, "one": o}
        if target and target in df.columns:
            yt = pd.to_numeric(df[target], errors="coerce")
            sub = pd.DataFrame({"b": b, "y": yt})[valid & yt.notna()]
            if len(sub):
                m0 = float(sub.loc[sub["b"] == 0, "y"].mean()) if (sub["b"] == 0).any() else None
                m1 = float(sub.loc[sub["b"] == 1, "y"].mean()) if (sub["b"] == 1).any() else None
                entry["meanTargetIfZero"] = m0
                entry["meanTargetIfOne"] = m1
        binary_stack.append(entry)

    corr_cols = num_cols[:28]
    correlation = {"columns": [], "matrix": []}
    if len(corr_cols) >= 2:
        sub = df[corr_cols].apply(pd.to_numeric, errors="coerce")
        cmat = sub.corr(numeric_only=True)
        correlation = {
            "columns": corr_cols,
            "matrix": cmat.where(~np.isnan(cmat), np.nan).values.tolist(),
        }

    for dc in _datetime_columns(df, 2):
        slot = pd.DataFrame({"t": pd.to_datetime(df[dc], errors="coerce")})
        if target and target in df.columns:
            slot["v"] = pd.to_numeric(df[target], errors="coerce")
        slot = slot.dropna(subset=["t"])
        if len(slot) < 3:
            continue
        slot = slot.set_index("t").sort_index()
        if target and target in df.columns:
            agg = slot.resample("D").mean(numeric_only=True).dropna(how="all", subset=["v"])
            metric_name = target
        else:
            agg = slot.resample("D").size().to_frame(name="v")
            metric_name = "__count__"
        if len(agg) < 3:
            continue
        agg = agg.reset_index().tail(500)
        line_series.append(
            {
                "column": dc,
                "times": [t.isoformat() if hasattr(t, "isoformat") else str(t) for t in agg["t"]],
                "values": [float(x) if pd.notna(x) else None for x in agg["v"]],
                "metric": None if metric_name == "__count__" else metric_name,
            }
        )

    return {
        "histograms": histograms,
        "topBars": top_bars,
        "pies": pies,
        "scatter": scatter,
        "binaryStack": binary_stack,
        "correlation": correlation,
        "targetDist": target_dist,
        "lineSeries": line_series,
        "meta": {"numericColumnsConsidered": num_cols, "categoricalColumnsConsidered": cat_cols},
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
            target = body.get("target")
            if target is not None and not isinstance(target, str):
                send_json(self, 400, {"error": "target_invalid"})
                return
            df = load_df(csv_text)
            if target and target not in df.columns:
                send_json(self, 400, {"error": "target_not_found", "target": target})
                return
            payload = _build_eda(df, target)
            send_json(self, 200, payload)
        except ValueError as e:
            send_json(self, 400, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            send_json(self, 500, {"error": "eda_failed", "detail": str(e)})

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return
