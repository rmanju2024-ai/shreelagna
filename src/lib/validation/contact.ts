import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.union([z.string().trim().email().max(120), z.literal("")]).optional(),
  mobile: z.string().trim().max(15).optional(),
  city: z.string().trim().max(80).optional(),
  enquiry_type: z.enum(["vadhu", "vara", "general"]).optional(),
  message: z.string().trim().min(10).max(2000),
  company: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function parseContactForm(raw: Record<string, unknown>): {
  ok: true;
  data: ContactInput;
  spam: boolean;
} | { ok: false; error: string } {
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  if (parsed.data.company) {
    return { ok: true, data: parsed.data, spam: true };
  }
  return { ok: true, data: parsed.data, spam: false };
}
