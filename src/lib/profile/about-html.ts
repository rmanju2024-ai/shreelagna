export const ABOUT_MIN = 80;
export const ABOUT_MAX = 1200;
export const ABOUT_HTML_MAX = 8000;
export const FAMILY_NOTE_MAX = 600;
export const FAMILY_NOTE_HTML_MAX = 8000;
export const HOPE_NOTE_MAX = 600;
export const HOPE_NOTE_HTML_MAX = 8000;

export function aboutPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function sanitizeAboutHtml(raw: string): string {
  if (!raw) return "";
  let html = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(
    /<\/?(script|style|iframe|object|embed|link|meta|form|textarea|input|svg|math)[^>]*>/gi,
    "",
  );
  html = html.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/javascript\s*:/gi, "");
  html = html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag: string, attrs = "") => {
    const name = tag.toLowerCase();
    const closing = full.startsWith("</");
    if (!KEEP.has(name)) return "";
    if (name === "br") return "<br>";
    if (closing) {
      if (name === "font") return "</span>";
      if (name === "div") return "</p>";
      if (name === "strong") return "</b>";
      if (name === "em") return "</i>";
      return `</${name}>`;
    }
    const style = styleFrom(attrs);
    if (name === "font" || name === "span") return style ? `<span style="${style}">` : "<span>";
    if (name === "div" || name === "p") return style ? `<p style="${style}">` : "<p>";
    if (name === "strong") return "<b>";
    if (name === "em") return "<i>";
    return `<${name}>`;
  });
  return html.trim();
}

const KEEP = new Set(["b", "i", "u", "strong", "em", "span", "p", "div", "font", "br"]);

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function attr(attrs: string, name: string): string {
  const re = new RegExp(
    `${name}\\s*=\\s*"([^"]*)"|${name}\\s*=\\s*'([^']*)'|${name}\\s*=\\s*([^\\s>]+)`,
    "i",
  );
  const m = attrs.match(re);
  return (m?.[1] ?? m?.[2] ?? m?.[3] ?? "").trim();
}

function safeColor(val: string): string | null {
  const v = val.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return v;
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i.test(v)) return v;
  if (/^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/i.test(v)) return v;
  if (/^[a-z]{3,20}$/i.test(v) && !/url|expression|javascript/i.test(v)) return v.toLowerCase();
  return null;
}

function safeFamily(val: string): string | null {
  const v = val.replace(/["']/g, "").trim();
  if (!v || v.length > 80) return null;
  if (!/^[\w\s,\-]+$/.test(v)) return null;
  return v;
}

function safeSize(val: string): string | null {
  const v = val.trim();
  if (!/^\d+(\.\d+)?(px|pt|rem|em)$/i.test(v)) return null;
  const n = parseFloat(v);
  if (n < 10 || n > 40) return null;
  return v;
}

function styleFrom(attrs: string): string {
  const out: string[] = [];
  for (const part of attr(attrs, "style").split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const key = part.slice(0, i).trim().toLowerCase();
    const val = part.slice(i + 1).trim();
    if (!val || /expression|url\s*\(|javascript/i.test(val)) continue;
    if (key === "color") {
      const c = safeColor(val);
      if (c) out.push(`color: ${c}`);
    } else if (key === "font-family") {
      const f = safeFamily(val);
      if (f) out.push(`font-family: ${f}`);
    } else if (key === "font-size") {
      const s = safeSize(val);
      if (s) out.push(`font-size: ${s}`);
    } else if (key === "font-weight" && /^(bold|normal|[1-9]00)$/i.test(val)) {
      out.push(`font-weight: ${val.toLowerCase()}`);
    } else if (key === "font-style" && /^(italic|normal)$/i.test(val)) {
      out.push(`font-style: ${val.toLowerCase()}`);
    } else if (key === "text-decoration" && /^(underline|none|line-through)$/i.test(val)) {
      out.push(`text-decoration: ${val.toLowerCase()}`);
    }
  }
  const color = safeColor(attr(attrs, "color"));
  const face = safeFamily(attr(attrs, "face"));
  const size = attr(attrs, "size");
  if (color) out.push(`color: ${color}`);
  if (face) out.push(`font-family: ${face}`);
  const sizeMap: Record<string, string> = {
    "1": "12px",
    "2": "14px",
    "3": "16px",
    "4": "18px",
    "5": "22px",
    "6": "26px",
    "7": "32px",
  };
  if (sizeMap[size]) out.push(`font-size: ${sizeMap[size]}`);
  return [...new Set(out)].join("; ");
}
