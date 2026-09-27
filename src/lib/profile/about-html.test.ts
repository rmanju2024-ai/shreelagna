import { describe, expect, it } from "vitest";
import { aboutPlainText, sanitizeAboutHtml } from "./about-html";

describe("about html", () => {
  it("counts visible characters, not tags", () => {
    expect(aboutPlainText(`<b>${"A".repeat(80)}</b>`).length).toBe(80);
    expect(aboutPlainText("<p>Hello<br>there</p>")).toBe("Hello\nthere");
    expect(aboutPlainText(undefined)).toBe("");
  });

  it("keeps bold, colour and font, strips scripts", () => {
    const clean = sanitizeAboutHtml(
      `<b onclick="alert(1)">Hi</b><script>x()</script><font color="#6f1d1b" face="Georgia">Story</font>`,
    );
    expect(clean).toContain("<b>Hi</b>");
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).toContain("color: #6f1d1b");
    expect(clean).toContain("font-family: Georgia");
  });
});
