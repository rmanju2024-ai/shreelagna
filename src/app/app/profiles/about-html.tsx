import { aboutPlainText } from "@/lib/profile/about-html";

export function AboutHtml({ html, className }: { html: string; className?: string }) {
  return (
    <div className={className} style={{ whiteSpace: "pre-wrap" }}>
      {aboutPlainText(html)}
    </div>
  );
}
