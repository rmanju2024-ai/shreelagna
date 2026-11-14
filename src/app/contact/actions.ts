"use server";

import { getAuth } from "@/lib/auth/session";
import { parseContactForm } from "@/lib/validation/contact";
import { createClient } from "@/lib/supabase/server";

export async function submitContact(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = parseContactForm({
    name: formData.get("name"),
    email: formData.get("email"),
    mobile: formData.get("mobile"),
    city: formData.get("city"),
    enquiry_type: formData.get("enquiry_type") || undefined,
    message: formData.get("message"),
    company: formData.get("company") ?? "",
  });

  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  if (parsed.spam) {
    return { ok: true };
  }

  try {
    const { user } = await getAuth();
    const supabase = await createClient();
    const row = {
      name: parsed.data.name,
      email: parsed.data.email || user?.email || null,
      mobile: parsed.data.mobile || null,
      city: parsed.data.city || null,
      enquiry_type: parsed.data.enquiry_type || "general",
      message: parsed.data.message,
      honeypot: null,
      created_by: user?.id ?? null,
    };
    let { error } = await supabase.from("tickets").insert(row);
    if (error && /created_by/i.test(error.message ?? "")) {
      const { created_by: _owner, ...legacy } = row;
      ({ error } = await supabase.from("tickets").insert(legacy));
    }
    if (error) {
      return { ok: false, error: "Could not save just now. Try again later." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send just now. Please try again shortly." };
  }
}
