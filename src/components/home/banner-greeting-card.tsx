"use client";

import { useEffect, useState } from "react";

type GreetingMark = "sunrise" | "sun" | "dusk" | "spark";

interface Greeting {
  text: string;
  mark: GreetingMark;
}

export function getGreeting(now = new Date()): Greeting {
  const h = now.getHours();
  if (h >= 5 && h < 12) return { text: "Good Morning", mark: "sunrise" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", mark: "sun" };
  if (h >= 17 && h < 21) return { text: "Good Evening", mark: "dusk" };
  return { text: "Welcome tonight", mark: "spark" };
}

function GreetingJewel({ mark }: { mark: GreetingMark }) {
  return (
    <svg className="home-greeting-mark" viewBox="0 0 24 24" aria-hidden focusable="false">
      {mark === "sunrise" ? (
        <>
          <path
            fill="currentColor"
            d="M12 3.2 13.2 6h2.6L14 7.8l.8 2.6L12 9.2 9.2 10.4l.8-2.6L8.2 6h2.6L12 3.2Z"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M5 16.5c1.8-2.4 4.2-3.6 7-3.6s5.2 1.2 7 3.6M4 19.2h16M7.4 14.2 6 12.6M16.6 14.2 18 12.6M12 12.2V10"
          />
        </>
      ) : null}
      {mark === "sun" ? (
        <>
          <circle cx="12" cy="12" r="4.1" fill="currentColor" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.7 5.7l1.5 1.5M16.8 16.8l1.5 1.5M18.3 5.7l-1.5 1.5M7.2 16.8l-1.5 1.5"
          />
        </>
      ) : null}
      {mark === "dusk" ? (
        <>
          <path fill="currentColor" d="M6.2 15.2a5.8 5.8 0 0 1 11.6 0H6.2Z" />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M4 17.8h16M12 6.2v2.2M7.2 8.2 8.4 9.8M16.8 8.2 15.6 9.8"
          />
        </>
      ) : null}
      {mark === "spark" ? (
        <path
          fill="currentColor"
          d="M12 2.6 13.6 8.4 19.4 10 13.6 11.6 12 17.4 10.4 11.6 4.6 10 10.4 8.4 12 2.6Zm6.6 12.2.8 2.4 2.4.7-2.4.7-.8 2.4-.8-2.4-2.4-.7 2.4-.7.8-2.4ZM5.4 14.4l.6 1.8 1.8.5-1.8.5-.6 1.8-.6-1.8-1.8-.5 1.8-.5.6-1.8Z"
        />
      ) : null}
    </svg>
  );
}

/** Tagline-style greeting — replaces BrandMotto in the home panel for logged-in users */
export function BannerGreetingTagline({
  name,
  mark,
}: {
  name: string;
  mark: "admin" | "staff" | "member";
}) {
  const [g, setG] = useState<Greeting | null>(null);
  useEffect(() => { setG(getGreeting()); }, []);

  const roleLabel = mark === "admin" ? "Admin" : mark === "staff" ? "Staff" : "Member";

  return (
    <p
      className="home-greeting"
      aria-label={g ? `${g.text}, ${name}` : `Welcome back, ${name}`}
    >
      <span className="home-greeting-chip">
        {g ? (
          <>
            {g.text}
            <GreetingJewel mark={g.mark} />
          </>
        ) : (
          "Welcome back"
        )}
      </span>
      <strong className="home-greeting-name">{name}</strong>
      {mark !== "member" ? <span className="home-greeting-role">{roleLabel}</span> : null}
    </p>
  );
}
