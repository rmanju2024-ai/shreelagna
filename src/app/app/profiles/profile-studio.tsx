"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { FieldMark } from "@/app/app/profiles/field-mark";
import type { ProfileEditTarget } from "@/lib/profile/sections";

export type StudioTabId = "album" | "personal" | "life" | "faith" | "family" | "about" | "partner";

export const STUDIO_TABS: readonly {
  id: StudioTabId;
  label: string;
  short: string;
  mark: string;
  page?: number;
}[] = [
  { id: "album", label: "Album", short: "Album", mark: "Photograph" },
  { id: "personal", label: "Personal", short: "Personal", mark: "Name", page: 1 },
  { id: "life", label: "Life", short: "Life", mark: "Occupation", page: 2 },
  { id: "faith", label: "Faith", short: "Faith", mark: "Religion", page: 3 },
  { id: "family", label: "Family", short: "Family", mark: "Family", page: 4 },
  { id: "about", label: "About", short: "About", mark: "About" },
  { id: "partner", label: "Preference", short: "Match", mark: "Partner", page: 5 },
];

const StudioCtx = createContext<{
  tab: StudioTabId;
  page: number;
  setTab: (id: StudioTabId) => void;
} | null>(null);

export function useStudioTab() {
  return useContext(StudioCtx);
}

export function studioTabFromSection(section?: ProfileEditTarget): StudioTabId {
  if (!section) return "personal";
  if (section === "work") return "life";
  if (STUDIO_TABS.some((item) => item.id === section)) return section as StudioTabId;
  return "personal";
}

export function ProfileStudio({
  initial,
  album,
  about,
  children,
}: {
  initial?: ProfileEditTarget;
  album: ReactNode;
  about: ReactNode;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<StudioTabId>(() => studioTabFromSection(initial));
  const page = useMemo(() => STUDIO_TABS.find((row) => row.id === tab)?.page ?? 1, [tab]);
  const formOpen = tab !== "album" && tab !== "about";

  function choose(id: StudioTabId) {
    setTab(id);
    const url = new URL(window.location.href);
    url.searchParams.set("edit", "1");
    url.searchParams.set("section", id === "life" ? "work" : id);
    window.history.replaceState(null, "", url);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  return (
    <StudioCtx.Provider value={{ tab, page, setTab: choose }}>
      <div className="profile-studio" data-tab={tab}>
        <nav className="profile-wizard-steps profile-studio-tabs" aria-label="Edit profile sections">
          {STUDIO_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "is-current" : ""}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => choose(item.id)}
            >
              <b>
                <FieldMark label={item.mark} />
              </b>
              <span>
                <strong>{item.short}</strong>
                <small>{item.label}</small>
              </span>
            </button>
          ))}
        </nav>
        <div className="profile-studio-pane" hidden={tab !== "album"}>
          {album}
        </div>
        <div className="profile-studio-pane" hidden={tab !== "about"}>
          {about}
        </div>
        <div className="profile-studio-pane" hidden={!formOpen}>
          {children}
        </div>
      </div>
    </StudioCtx.Provider>
  );
}
