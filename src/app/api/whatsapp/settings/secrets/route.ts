import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const { organization_id, provider, encrypted_key } = (await req.json()) as {
    organization_id: string;
    provider: string;
    encrypted_key: string;
  };

  if (!organization_id || !provider || !encrypted_key) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase.from("wa_provider_secrets").upsert(
    { organization_id, provider, encrypted_key },
    { onConflict: "organization_id,provider" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
