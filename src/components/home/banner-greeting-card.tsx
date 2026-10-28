"use client";

import { useEffect, useState } from "react";

interface Greeting { text: string; emoji: string }

export function getGreeting(now = new Date()): Greeting {
  const h = now.getHours();
  if (h >= 5  && h < 12) return { text: "Good Morning",   emoji: "🌅" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", emoji: "☀️" };
  if (h >= 17 && h < 21) return { text: "Good Evening",   emoji: "🌆" };
  return                         { text: "Welcome tonight", emoji: "✨" };
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
        {g ? `${g.text} ${g.emoji}` : "Welcome back"}
      </span>
      <strong className="home-greeting-name">{name}</strong>
      <span className="home-greeting-role">{roleLabel}</span>
    </p>
  );
}
