"use client";

import { useEffect, useState } from "react";
import { HouseRoleSeal } from "@/components/house-role-seal";

interface Greeting { text: string; emoji: string }

function getGreeting(): Greeting {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: "Good Morning",   emoji: "🌅" };
  if (h >= 12 && h < 17) return { text: "Good Afternoon", emoji: "☀️" };
  if (h >= 17 && h < 21) return { text: "Good Evening",   emoji: "🌆" };
  return                         { text: "Good Night",     emoji: "🌙" };
}

export function BannerGreetingCard({
  name,
  mark,
}: {
  name: string;
  mark: "admin" | "staff" | "member";
}) {
  const [g, setG] = useState<Greeting | null>(null);

  useEffect(() => { setG(getGreeting()); }, []);

  const label = mark === "admin" ? "Admin" : mark === "staff" ? "Staff" : "Member";

  return (
    <div className="banner-greeting" aria-label={g ? `${g.text}, ${name}` : `Welcome, ${name}`}>
      {/* Membership seal */}
      <span className="banner-greeting-seal">
        <HouseRoleSeal mark={mark} />
        <span className="banner-greeting-badge">{label}</span>
      </span>

      {/* Divider */}
      <span className="banner-greeting-divider" aria-hidden />

      {/* Text block */}
      <span className="banner-greeting-body">
        <span className="banner-greeting-salute">
          {g ? `${g.text} ${g.emoji}` : "Welcome"}
        </span>
        <strong className="banner-greeting-name">{name}</strong>
      </span>
    </div>
  );
}
