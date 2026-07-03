import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const organizationId = req.nextUrl.searchParams.get("organization_id");
  if (!organizationId) {
    return NextResponse.json({ error: "organization_id required" }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("wa_organization_members")
    .select("id, user_id, role, whatsapp_phone, users:user_id(email, raw_user_meta_data)")
    .eq("organization_id", organizationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ members: data });
}
