const BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    const detail = typeof body === "object" && body !== null && "detail" in body
      ? (body as { detail?: unknown }).detail : null;
    super(typeof detail === "string" ? detail : `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

async function readError(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json().catch(() => null);
  const message = await response.text().catch(() => "");
  return message ? { detail: message.slice(0, 500) } : null;
}

async function request<T>(method: string, path: string, body?: JsonBody, token?: string | null): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin", signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("The server took too long to respond. Please try again.");
    throw new Error("Could not reach Tongue Circle. Check your connection and try again.");
  }
  if (!response.ok) throw new ApiError(response.status, await readError(response));
  if (response.status === 204 || response.status === 205) return undefined as T;
  return (await response.json()) as T;
}

export const apiGet = <T>(path: string, token?: string | null) => request<T>("GET", path, undefined, token);
export const apiPost = <T>(path: string, body?: JsonBody, token?: string | null) => request<T>("POST", path, body ?? null, token);
export const apiPut = <T>(path: string, body?: JsonBody, token?: string | null) => request<T>("PUT", path, body ?? null, token);
export const apiPatch = <T>(path: string, body?: JsonBody, token?: string | null) => request<T>("PATCH", path, body ?? null, token);
export const apiDelete = <T>(path: string, token?: string | null) => request<T>("DELETE", path, undefined, token);

export async function apiPostStream(path: string, body: JsonBody, token: string | null, onChunk: (text: string) => void): Promise<void> {
  const headers = new Headers({ "Content-Type": "application/json", Accept: "text/event-stream" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: "POST", headers, body: JSON.stringify(body), credentials: "same-origin", signal: AbortSignal.timeout(90_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") throw new Error("Translation took too long. Please try again.");
    throw new Error("Could not reach the translation service. Check your connection.");
  }
  if (!response.ok) throw new ApiError(response.status, await readError(response));
  if (!response.body) throw new Error("Translation stream is unavailable");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  const processEvent = (raw: string) => {
    let eventName = "message";
    let dataText = "";
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataText += line.slice(5).trim();
    }
    if (!dataText || dataText === "[DONE]") return;
    let data: { text?: string; status?: number; detail?: string };
    try { data = JSON.parse(dataText) as typeof data; } catch { return; }
    if (eventName === "error") throw new ApiError(data.status ?? 502, { detail: data.detail });
    if (typeof data.text === "string" && data.text) onChunk(data.text);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const events = pending.split("\n\n");
      pending = events.pop() ?? "";
      for (const event of events) processEvent(event);
      if (done) {
        if (pending.trim()) processEvent(pending);
        break;
      }
    }
  } finally { reader.releaseLock(); }
}
