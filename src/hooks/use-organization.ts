"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useOrganization() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      supabase
        .from("wa_organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1)
        .single()
        .then(({ data }) => {
          setOrganizationId(data?.organization_id ?? null);
          setLoading(false);
        });
    });
  }, []);

  return { organizationId, loading };
}
