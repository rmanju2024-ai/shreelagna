export function MediaMark({ line }: { line?: string | null }) {
  const text = (line ?? "").trim();
  if (!text) return null;
  return (
    <span className="media-mark" aria-hidden>
      <span>{text}</span>
      <span>{text}</span>
      <span>{text}</span>
    </span>
  );
}
