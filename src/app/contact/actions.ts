"use server";

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
    const supabase = await createClient();
    const { error } = await supabase.from("tickets").insert({
      name: parsed.data.name,
      email: parsed.data.email || null,
      mobile: parsed.data.mobile || null,
      city: parsed.data.city || null,
      enquiry_type: parsed.data.enquiry_type || "general",
      message: parsed.data.message,
      honeypot: null,
    });
    if (error) {
      return { ok: false, error: "Could not save just now. Try again later." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not send just now. Please try again shortly." };
  }
}
