const COPY: Record<string, { text: string; tone: "ok" | "warn" }> = {
  blocked: { text: "Profile blocked. You will not see each other any more.", tone: "ok" },
  reported: { text: "Thank you. Your confidential report reached our safety team.", tone: "ok" },
  block_error: { text: "Could not block this profile just now. Please try again.", tone: "warn" },
  report_error: { text: "Could not send the report just now. Please try again.", tone: "warn" },
};

export function SafetyFlash({ code }: { code?: string }) {
  const item = code ? COPY[code] : undefined;
  if (!item) return null;
  return (
    <p className={`safety-flash is-${item.tone}`} role="status">
      {item.text}
    </p>
  );
}
