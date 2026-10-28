import type { ReactNode } from "react";

/** Site icons: solid filled shapes, large enough to read at a glance. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
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
          <path d="M12 3.2 2.8 11.2h2.4V20.5h5.2v-5.6h3.2v5.6h5.2v-9.3h2.4L12 3.2Z" />
        </Icon>
      );
    case "browse":
      return (
        <Icon>
          <path d="M10.2 3.6a6.6 6.6 0 1 0 4.1 11.8l4.7 4.7 1.6-1.6-4.7-4.7A6.6 6.6 0 0 0 10.2 3.6Zm0 2.4a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z" />
        </Icon>
      );
    case "inbox":
      return (
        <Icon>
          <path d="M12 20.8 10.4 19.4C5.3 14.8 2 11.9 2 8.5A4.4 4.4 0 0 1 6.5 4 4.8 4.8 0 0 1 12 6.7 4.8 4.8 0 0 1 17.5 4 4.4 4.4 0 0 1 22 8.5c0 3.4-3.3 6.3-8.4 10.9L12 20.8Z" />
        </Icon>
      );
    case "chat":
      return (
        <Icon>
          <path d="M4 3.5h16A2.5 2.5 0 0 1 22.5 6v9.2A2.5 2.5 0 0 1 20 17.7h-6.2L6.2 22v-4.3H4A2.5 2.5 0 0 1 1.5 15.2V6A2.5 2.5 0 0 1 4 3.5Z" />
        </Icon>
      );
    case "alerts":
      return (
        <Icon>
          <path d="M12 22a2.4 2.4 0 0 0 2.4-2.3H9.6A2.4 2.4 0 0 0 12 22Zm8-4.2-1.7-1.7V11a6.2 6.2 0 0 0-4.6-6V4.2a1.7 1.7 0 1 0-3.4 0V5A6.2 6.2 0 0 0 5.7 11v5.1L4 17.8V19h16v-1.2Z" />
        </Icon>
      );
    case "profile":
    case "account":
      return (
        <Icon>
          <circle cx="12" cy="8" r="4.1" />
          <path d="M4.2 20.4c.6-3.8 3.6-6 7.8-6s7.2 2.2 7.8 6H4.2Z" />
        </Icon>
      );
    case "plans":
      return (
        <Icon>
          <path d="M5.2 4.2h13.6A1.6 1.6 0 0 1 20.4 5.8v12.8a1.6 1.6 0 0 1-1.6 1.6H5.2a1.6 1.6 0 0 1-1.6-1.6V5.8a1.6 1.6 0 0 1 1.6-1.6Zm2 3.2v1.7h9.6V7.4H7.2Zm0 3.6v1.7h9.6v-1.7H7.2Zm0 3.6v1.7h6.4v-1.7H7.2Z" />
        </Icon>
      );
    case "staff":
    case "safety":
      return (
        <Icon>
          <path d="M12 2.8 20 6.2v5.6c0 4.8-3.2 8.2-8 10-4.8-1.8-8-5.2-8-10V6.2L12 2.8Zm-1.1 11.6 5-5 1.4 1.4-6.4 6.4-3.4-3.4 1.4-1.4 2 2Z" />
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
          <path d="M12 2.4A9.6 9.6 0 1 0 21.6 12 9.6 9.6 0 0 0 12 2.4Zm1 14.4h-2v-6h2v6Zm0-7.6h-2V7.2h2v1.6Z" />
        </Icon>
      );
    case "help":
      return (
        <Icon>
          <path d="M12 2.4A9.6 9.6 0 1 0 21.6 12 9.6 9.6 0 0 0 12 2.4Zm.2 15.4h-1.8v-1.9h1.8v1.9Zm2.3-6.1c-.4.4-.8.8-1 1.2-.2.3-.3.7-.3 1.1h-2c0-.7.2-1.3.5-1.8.3-.5.8-1 1.3-1.4.4-.4.6-.8.6-1.3A1.6 1.6 0 0 0 12 8a1.6 1.6 0 0 0-1.6 1.5H8.4A3.6 3.6 0 0 1 12 6.2a3.6 3.6 0 0 1 3.6 3.5c0 .9-.3 1.6-.9 2Z" />
        </Icon>
      );
    case "more":
      return (
        <Icon>
          <path d="M4 6.2h16v2.4H4V6.2Zm0 4.6h16v2.4H4v-2.4Zm0 4.6h16v2.4H4v-2.4Z" />
        </Icon>
      );
    case "out":
      return (
        <Icon>
          <path d="M4 4.2h8.2v2.2H6.2v11.2h6V19.8H4V4.2Zm10.2 3.4 5.4 4.4-5.4 4.4v-3.2H8.8v-2.4h5.4V7.6Z" />
        </Icon>
      );
    case "install":
      return (
        <Icon>
          <path d="M6.4 3.4h11.2A1.8 1.8 0 0 1 19.4 5.2v13.6a1.8 1.8 0 0 1-1.8 1.8H6.4a1.8 1.8 0 0 1-1.8-1.8V5.2A1.8 1.8 0 0 1 6.4 3.4Zm5.6 3.4v6.2H9.4L12 16l2.6-3h-2.6V6.8H12Z" />
        </Icon>
      );
    case "tickets":
      return (
        <Icon>
          <path d="M3.6 7.2h16.8v3.1c-1.5.3-2.5 1.4-2.5 2.7s1 2.4 2.5 2.7v3.1H3.6v-3.1c1.5-.3 2.5-1.4 2.5-2.7s-1-2.4-2.5-2.7V7.2Zm5.2 1.6v8.4h1.8V8.8H8.8Z" />
        </Icon>
      );
    case "analytics":
      return (
        <Icon>
          <path d="M4 19.4h16v1.8H4v-1.8Zm1.8-1.6V12h3.4v5.8H5.8Zm4.6 0V7.2h3.4v10.6h-3.4Zm4.6 0V9.6H18v8.2h-3.4Z" />
        </Icon>
      );
    case "audit":
      return (
        <Icon>
          <path d="M6.4 3.4h8.2L19.6 8.4v12.2H6.4V3.4Zm8 1.8v3.8h3.8L14.4 5.2ZM8.6 12h6.8v1.7H8.6V12Zm0 3.2h4.8v1.7H8.6v-1.7Z" />
        </Icon>
      );
    case "look":
      return (
        <Icon>
          <path d="M10.4 3.6a6.8 6.8 0 1 0 4.3 12.1l4.8 4.8 1.6-1.6-4.8-4.8A6.8 6.8 0 0 0 10.4 3.6Zm0 2.5a4.3 4.3 0 1 1 0 8.6 4.3 4.3 0 0 1 0-8.6Z" />
        </Icon>
      );
    case "block":
      return (
        <Icon>
          <path d="M12 2.4A9.6 9.6 0 1 0 21.6 12 9.6 9.6 0 0 0 12 2.4Zm7.2 9.6a7.1 7.1 0 0 1-1.5 4.4L7.6 6.3A7.2 7.2 0 0 1 19.2 12ZM6.3 7.6 16.4 17.7A7.2 7.2 0 0 1 6.3 7.6Z" />
        </Icon>
      );
    case "verify":
      return (
        <Icon>
          <path d="M12 2.4A9.6 9.6 0 1 0 21.6 12 9.6 9.6 0 0 0 12 2.4Zm-1.1 13.5-3.6-3.6 1.4-1.4 2.2 2.2 5.2-5.2 1.4 1.4-6.6 6.6Z" />
        </Icon>
      );
    default:
      return (
        <Icon>
          <circle cx="12" cy="12" r="8.2" />
        </Icon>
      );
  }
}
