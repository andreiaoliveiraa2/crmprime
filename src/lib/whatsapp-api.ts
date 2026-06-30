import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function waFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const baseUrl = process.env.WA_API_URL || "http://localhost:3001";

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

export const whatsappApi = {
  async get<T>(path: string): Promise<T> {
    const res = await waFetch(path);
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await waFetch(path, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await waFetch(path, { method: "PATCH", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
    return res.json();
  },

  async delete(path: string): Promise<void> {
    const res = await waFetch(path, { method: "DELETE" });
    if (!res.ok) throw new Error(`WA API error ${res.status}: ${await res.text()}`);
  },
};
