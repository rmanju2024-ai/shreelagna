export function NavGlyph({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 11.2V17" />
          <path d="M12 8.2h.01" />
        </svg>
      );
    case "browse":
      return (
        <svg {...common}>
          <circle cx="9" cy="8.2" r="2.4" />
          <circle cx="15.4" cy="8.2" r="2.4" />
          <path d="M4.8 18c.6-2.6 2.6-4 4.8-4s4.2 1.4 4.8 4" />
          <path d="M13.2 14.2c1.5-.4 3.2.2 4.4 1.6.6.7 1 1.6 1.2 2.2" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
          <path d="M9.6 9.4a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1.1.9-1.1 1.7V14" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "staff":
      return (
        <svg {...common}>
          <path d="M12 3.5 19 7v5.2c0 4.2-2.8 6.8-7 8.3-4.2-1.5-7-4.1-7-8.3V7l7-3.5Z" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.2" r="3.1" />
          <path d="M5.4 19c.8-3.2 3-5 6.6-5s5.8 1.8 6.6 5" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...common}>
          <path d="M4 7.5 12 13l8-5.5" />
          <path d="M5 6h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M5 16.5 3.8 20 8 18.2A8.2 8.2 0 1 0 5 16.5Z" />
        </svg>
      );
    case "alerts":
      return (
        <svg {...common}>
          <path d="M6.5 16h11" />
          <path d="M7.2 16a5.8 5.8 0 0 1 4.8-10 5.8 5.8 0 0 1 4.8 10" />
          <path d="M10 16v.8a2 2 0 0 0 4 0V16" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.1" />
          <path d="M19.2 12.8v-1.6l1.5-1.1-1.5-2.6-1.8.4a6.4 6.4 0 0 0-1.4-.8l-.3-1.8h-3l-.3 1.8a6.4 6.4 0 0 0-1.4.8l-1.8-.4-1.5 2.6 1.5 1.1v1.6l-1.5 1.1 1.5 2.6 1.8-.4c.4.3.9.6 1.4.8l.3 1.8h3l.3-1.8c.5-.2 1-.5 1.4-.8l1.8.4 1.5-2.6-1.5-1.1Z" />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="5.5" cy="12" r="1.4" fill="currentColor" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
          <circle cx="18.5" cy="12" r="1.4" fill="currentColor" />
        </svg>
      );
    case "out":
      return (
        <svg {...common}>
          <path d="M10 7V5.8A1.8 1.8 0 0 1 11.8 4H18a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6.2A1.8 1.8 0 0 1 10 18.2V17" />
          <path d="M4 12h10" />
          <path d="M11 9l3 3-3 3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" />
        </svg>
      );
  }
}
