const API_ROOT = "";

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error && typeof body.error === "string") return body.error;
    if (body?.detail && typeof body.detail === "string") return body.detail;
    return `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

export async function postProfile(csv: string, filename?: string) {
  const res = await fetch(`${API_ROOT}/api/profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv, filename }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postEda(csv: string, target: string | null) {
  const res = await fetch(`${API_ROOT}/api/eda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ csv, target }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function postInsights(profile: unknown, eda: unknown, datasetName: string | null) {
  const res = await fetch(`${API_ROOT}/api/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, eda, datasetName }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
