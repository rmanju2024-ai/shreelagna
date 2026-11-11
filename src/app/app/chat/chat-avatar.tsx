import Image from "next/image";

export function ChatAvatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md";
}) {
  const sizeClass = size === "sm" ? " is-sm" : size === "xs" ? " is-xs" : "";
  return (
    <span className={`wa-avatar${sizeClass}`} style={{ position: "relative" }}>
      {src ? (
        <Image src={src} alt="" fill sizes="64px" quality={60} style={{ objectFit: "cover" }} />
      ) : (
        <span>{name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
