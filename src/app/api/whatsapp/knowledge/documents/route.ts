import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getSessionToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function GET(req: NextRequest) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agentId = req.nextUrl.searchParams.get("agent_id");
  const res = await fetch(
    `${process.env.WA_API_URL}/knowledge/documents?agent_id=${agentId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const token = await getSessionToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const res = await fetch(`${process.env.WA_API_URL}/knowledge/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
