const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/api/health"),
  startSession: () => request("/api/session/start", { method: "POST" }),
  analyzeFrame: (sessionId, frameBase64) =>
    request(`/api/session/${sessionId}/analyze`, {
      method: "POST",
      body: JSON.stringify({ frame: frameBase64 }),
    }),
  getReport: (sessionId) => request(`/api/session/${sessionId}/report`),
  endSession: (sessionId) =>
    request(`/api/session/${sessionId}/end`, { method: "POST" }),
};

export { API_BASE };
