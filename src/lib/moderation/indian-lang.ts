import { aboutPlainText } from "@/lib/profile/about-html";

const SCRIPTS: { code: string; name: string; re: RegExp }[] = [
  { code: "ml", name: "Malayalam", re: /[\u0D00-\u0D7F]/ },
  { code: "ta", name: "Tamil", re: /[\u0B80-\u0BFF]/ },
  { code: "te", name: "Telugu", re: /[\u0C00-\u0C7F]/ },
  { code: "kn", name: "Kannada", re: /[\u0C80-\u0CFF]/ },
  { code: "hi", name: "Hindi", re: /[\u0900-\u097F]/ },
  { code: "bn", name: "Bengali", re: /[\u0980-\u09FF]/ },
  { code: "gu", name: "Gujarati", re: /[\u0A80-\u0AFF]/ },
  { code: "pa", name: "Punjabi", re: /[\u0A00-\u0A7F]/ },
  { code: "or", name: "Odia", re: /[\u0B00-\u0B7F]/ },
  { code: "ur", name: "Urdu", re: /[\u0600-\u06FF]/ },
];

export function isMemberAbout(text: string | null | undefined): boolean {
  const raw = aboutPlainText(text ?? "").trim();
  if (raw.length < 8) return false;
  if (/alter\s+table|supabase sql|begin;|commit;|--\s*run in/i.test(raw)) return false;
  return true;
}

export function detectReviewLang(text: string | null | undefined): { code: string; name: string } {
  const raw = aboutPlainText(text ?? "");
  for (const row of SCRIPTS) {
    if (row.re.test(raw)) return { code: row.code, name: row.name };
  }
  return { code: "en", name: "English" };
}

export async function translateToEnglish(text: string, source: string): Promise<string> {
  return translateText(text, source, "en");
}

export async function translateText(text: string, source: string, target: "en" | "kn"): Promise<string> {
  const raw = aboutPlainText(text).slice(0, 1200);
  if (!raw) return "";
  if (source === target) return raw;
  const chunks = splitChunks(raw, 400);
  const parts: string[] = [];
  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${encodeURIComponent(`${source}|${target}`)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("translate_failed");
    const body = (await res.json()) as { responseData?: { translatedText?: string }; responseStatus?: number };
    const line = body.responseData?.translatedText?.trim();
    if (!line || body.responseStatus !== 200) throw new Error("translate_failed");
    parts.push(line);
  }
  return parts.join(" ").trim();
}

function splitChunks(text: string, size: number): string[] {
  if (text.length <= size) return [text];
  const out: string[] = [];
  let rest = text;
  while (rest.length) {
    if (rest.length <= size) {
      out.push(rest);
      break;
    }
    let cut = rest.lastIndexOf(" ", size);
    if (cut < 40) cut = size;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  return out.filter(Boolean);
}
