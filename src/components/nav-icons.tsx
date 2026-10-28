import type { ReactNode } from "react";

/** Chunky filled glyphs (Material-style). Easy to read on the phone dock. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden
      focusable={false}
    >
      {children}
    </svg>
  );
}

export function NavGlyph({ name }: { name: string }) {
  switch (name) {
    case "home":
      return (
        <Icon>
          <path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
        </Icon>
      );
    case "browse":
    case "look":
      return (
        <Icon>
          <path
            fillRule="evenodd"
            d="M10 3a7 7 0 1 0 4.2 12.5l4.15 4.16 1.42-1.42-4.16-4.15A7 7 0 0 0 10 3Zm0 2.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Z"
          />
        </Icon>
      );
    case "inbox":
      return (
        <Icon>
          <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
        </Icon>
      );
    case "chat":
      return (
        <Icon>
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Z" />
        </Icon>
      );
    case "alerts":
      return (
        <Icon>
          <path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Zm8-5.5-1.8-1.8V10a6.2 6.2 0 0 0-4.7-6V3.2a2.5 2.5 0 1 0-5 0V4A6.2 6.2 0 0 0 3.8 10v4.7L2 16.5V18h20v-1.5Z" />
        </Icon>
      );
    case "profile":
    case "account":
      return (
        <Icon>
          <path d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Zm0 2.2c-3.2 0-9.2 1.6-9.2 4.8V21h18.4v-2c0-3.2-6-4.8-9.2-4.8Z" />
        </Icon>
      );
    case "plans":
      return (
        <Icon>
          <path d="M4 4h16v16H4V4Zm3 3.2h10V9H7V7.2Zm0 3.6h10v1.8H7v-1.8Zm0 3.6h7V16H7v-1.6Z" />
        </Icon>
      );
    case "staff":
    case "safety":
    case "verify":
      return (
        <Icon>
          <path d="M12 2 4 5.2v6.2c0 5 3.3 8.7 8 10.6 4.7-1.9 8-5.6 8-10.6V5.2L12 2Zm-1.2 13.2-3.4-3.4 1.4-1.4 2 2 4.8-4.8 1.4 1.4-6.2 6.2Z" />
        </Icon>
      );
    case "settings":
      return (
        <Icon>
          <path d="M19.1 12.9c0-.3 0-.6-.1-.9l2-1.6-1.9-3.3-2.4 1a7 7 0 0 0-1.6-.9l-.4-2.6h-3.8l-.4 2.6c-.6.2-1.1.5-1.6.9l-2.4-1-1.9 3.3 2 1.6c0 .3-.1.6-.1.9s0 .6.1.9l-2 1.6 1.9 3.3 2.4-1c.5.4 1 .7 1.6.9l.4 2.6h3.8l.4-2.6c.6-.2 1.1-.5 1.6-.9l2.4 1 1.9-3.3-2-1.6ZM12 15.4A3.4 3.4 0 1 1 12 8.6a3.4 3.4 0 0 1 0 6.8Z" />
        </Icon>
      );
    case "about":
      return (
        <Icon>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" />
        </Icon>
      );
    case "help":
      return (
        <Icon>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.2 16h-2v-2h2v2Zm2.4-6.4c-.4.4-.9.8-1.1 1.2-.3.4-.3.8-.3 1.2h-2c0-.8.2-1.4.5-2 .4-.5.9-1 1.4-1.4.4-.4.6-.8.6-1.4A1.7 1.7 0 0 0 12 7.6 1.7 1.7 0 0 0 10.3 9H8.3A3.7 3.7 0 0 1 12 5.6 3.7 3.7 0 0 1 15.7 9.2c0 1-.3 1.8-1.1 2.4Z" />
        </Icon>
      );
    case "more":
      return (
        <Icon>
          <path d="M3 6.5h18v2.4H3V6.5Zm0 4.3h18v2.4H3v-2.4Zm0 4.3h18v2.4H3v-2.4Z" />
        </Icon>
      );
    case "out":
      return (
        <Icon>
          <path d="M5 3h8v2.2H7.2v13.6H13V21H5V3Zm9.2 4.2 5.6 4.6-5.6 4.6v-3.3H9.2v-2.6h5v-3.3Z" />
        </Icon>
      );
    case "install":
      return (
        <Icon>
          <path d="M5 2h14v20H5V2Zm7 4.2v7.2H9.6L12 17l2.4-3.6H12V6.2Z" />
        </Icon>
      );
    case "tickets":
      return (
        <Icon>
          <path d="M3 6h18v3.2a2.6 2.6 0 0 0 0 5.2V18H3v-3.6a2.6 2.6 0 0 0 0-5.2V6Zm6 2.2v7.6h2V8.2H9Z" />
        </Icon>
      );
    case "analytics":
      return (
        <Icon>
          <path d="M4 20h16v2H4v-2ZM6 18V11h4v7H6Zm5 0V6h4v12h-4Zm5 0V9h4v9h-4Z" />
        </Icon>
      );
    case "audit":
      return (
        <Icon>
          <path d="M6 2h9l5 5v15H6V2Zm9 1.8V8h4.2L15 3.8ZM8.5 12h7v1.8h-7V12Zm0 3.2h5v1.8h-5v-1.8Z" />
        </Icon>
      );
    case "block":
      return (
        <Icon>
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm7.5 10a7.4 7.4 0 0 1-1.6 4.6L7.4 6.1A7.5 7.5 0 0 1 19.5 12ZM4.5 12a7.5 7.5 0 0 1 12.1-5.9L6.1 16.6A7.4 7.4 0 0 1 4.5 12Z" />
        </Icon>
      );
    default:
      return (
        <Icon>
          <circle cx="12" cy="12" r="8" />
        </Icon>
      );
  }
}
