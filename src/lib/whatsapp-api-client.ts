"use client";

async function waClientFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`/api/whatsapp${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

export const waClient = {
  async get<T>(path: string): Promise<T> {
    const res = await waClientFetch(path);
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
    return res.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await waClientFetch(path, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
    return res.json();
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await waClientFetch(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
    return res.json();
  },

  async delete(path: string): Promise<void> {
    const res = await waClientFetch(path, { method: "DELETE" });
    if (!res.ok) throw new Error(`WA API error ${res.status}`);
  },
};
