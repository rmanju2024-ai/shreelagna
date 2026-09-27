export function ChatAvatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md";
}) {
  return (
    <span className={`wa-avatar${size === "sm" ? " is-sm" : ""}`}>
      {src ? <img src={src} alt="" /> : <span>{name.slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}
