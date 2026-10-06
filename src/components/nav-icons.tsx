/** Site icons: 24px rounded line set with a soft duotone fill (fill deepens on the active tab). */
export function NavGlyph({ name }: { name: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };
  const duo = { className: "ico-duo", fill: "currentColor", fillOpacity: 0.14 };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path {...duo} d="M4 11 12 4l8 7v8a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19v-8Z" />
        </svg>
      );
    case "browse":
      return (
        <svg {...common}>
          <circle {...duo} cx="12" cy="12" r="9" />
          <path {...duo} fillOpacity={0.4} d="m16.2 7.8-2.3 6.1-6.1 2.3 2.3-6.1 6.1-2.3Z" />
          <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...common}>
          <path {...duo} d="M12 20.5s-8-4.9-8-11a4.6 4.6 0 0 1 8-3.1 4.6 4.6 0 0 1 8 3.1c0 6.1-8 11-8 11Z" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path {...duo} d="M6 4.5h12A2.5 2.5 0 0 1 20.5 7v8a2.5 2.5 0 0 1-2.5 2.5h-6.2L7.5 21v-3.5H6A2.5 2.5 0 0 1 3.5 15V7A2.5 2.5 0 0 1 6 4.5Z" />
          <path d="M8 9.5h8M8 12.8h5" />
        </svg>
      );
    case "alerts":
      return (
        <svg {...common}>
          <path {...duo} d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" />
          <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle {...duo} cx="12" cy="8.5" r="3.6" />
          <path {...duo} d="M4.8 20c.7-3.7 3.6-5.6 7.2-5.6s6.5 1.9 7.2 5.6H4.8Z" />
        </svg>
      );
    case "plans":
      return (
        <svg {...common}>
          <path {...duo} d="m12 3.5 2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.4-.7 2.4-5Z" />
        </svg>
      );
    case "staff":
      return (
        <svg {...common}>
          <path {...duo} d="M12 3.5 19 6.5v5.3c0 4.3-2.9 7.1-7 8.7-4.1-1.6-7-4.4-7-8.7V6.5l7-3Z" />
          <path d="m8.8 12 2.2 2.2 4.2-4.4" />
        </svg>
      );
    case "account":
      return (
        <svg {...common}>
          <rect {...duo} x="3.6" y="3.6" width="7.2" height="7.2" rx="1.8" />
          <rect {...duo} x="13.2" y="3.6" width="7.2" height="7.2" rx="1.8" />
          <rect {...duo} x="3.6" y="13.2" width="7.2" height="7.2" rx="1.8" />
          <rect {...duo} x="13.2" y="13.2" width="7.2" height="7.2" rx="1.8" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
          <circle {...duo} cx="15" cy="7" r="2.2" />
          <circle {...duo} cx="9" cy="17" r="2.2" />
        </svg>
      );
    case "about":
      return (
        <svg {...common}>
          <circle {...duo} cx="12" cy="12" r="8.5" />
          <path d="M12 11v5.2M12 7.9h.01" strokeWidth={2} />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle {...duo} cx="12" cy="12" r="8.5" />
          <path d="M9.7 9.6a2.4 2.4 0 1 1 3.4 2.2c-.7.4-1.1.9-1.1 1.6M12 16.8h.01" />
        </svg>
      );
    case "more":
      return (
        <svg {...common}>
          <circle cx="6" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case "out":
      return (
        <svg {...common}>
          <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10" />
          <path d="M14 8.5 18 12l-4 3.5M18 12H9.5" />
        </svg>
      );
    case "install":
      return (
        <svg {...common}>
          <path {...duo} d="M7 3.8h10A1.7 1.7 0 0 1 18.7 5.5v13A1.7 1.7 0 0 1 17 20.2H7A1.7 1.7 0 0 1 5.3 18.5v-13A1.7 1.7 0 0 1 7 3.8Z" />
          <path d="M12 7.2v7.2M9.4 12.2 12 14.8l2.6-2.6" />
        </svg>
      );
    case "tickets":
      return (
        <svg {...common}>
          <path {...duo} d="M4.5 8.2h15v3.2c-1.2.2-2 1.1-2 2.3s.8 2.1 2 2.3v3.2h-15v-3.2c1.2-.2 2-1.1 2-2.3s-.8-2.1-2-2.3V8.2Z" />
          <path d="M9 9.2v9.2" />
        </svg>
      );
    case "safety":
      return (
        <svg {...common}>
          <path {...duo} d="M12 3.5 19 6.5v5.3c0 4.3-2.9 7.1-7 8.7-4.1-1.6-7-4.4-7-8.7V6.5l7-3Z" />
          <path d="M12 10.2v3.2M12 16.2h.01" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...common}>
          <path {...duo} d="M4.5 18.5h15" />
          <path {...duo} d="M6.5 18.5v-6.2h3.2V18.5H6.5Z" />
          <path {...duo} d="M10.4 18.5V7.8h3.2v10.7h-3.2Z" />
          <path {...duo} d="M14.3 18.5v-9.4h3.2v9.4h-3.2Z" />
        </svg>
      );
    case "audit":
      return (
        <svg {...common}>
          <path {...duo} d="M7.2 4.2h7.2L18.8 8.6v11.2H7.2V4.2Z" />
          <path d="M14.2 4.4v4.4h4.4M9.2 12.2h6.4M9.2 15.2h4.6" />
        </svg>
      );
    case "look":
      return (
        <svg {...common}>
          <circle {...duo} cx="10.5" cy="10.5" r="5.4" />
          <path d="m14.4 14.4 5 5" />
        </svg>
      );
    case "verify":
      return (
        <svg {...common}>
          <circle {...duo} cx="12" cy="12" r="8.5" />
          <path d="m8.6 12.2 2.2 2.2 4.6-4.8" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle {...duo} cx="12" cy="12" r="8.5" />
        </svg>
      );
  }
}
