import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSessionToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function proxyToApi(
  request: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const path = params.path.join("/");
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${process.env.WA_API_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "DELETE") {
    body = await request.text();
  }

  const response = await fetch(url, { method: request.method, headers, body });
  const responseData = await response.text();

  return new NextResponse(responseData, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToApi(req, await params);
}
