"use client";

import { useState } from "react";
import Link from "next/link";
import type { CompletenessItem } from "@/lib/profile/completeness";
import { SECTION_TITLES, type ProfileEditTarget } from "@/lib/profile/sections";

export function CompletenessMeter({
  profileId,
  mandatoryPct,
  overallPct,
  mandatoryFilled,
  mandatoryTotal,
  overallFilled,
  overallTotal,
  pendingMandatory,
  pendingRecommended,
}: {
  profileId: string;
  mandatoryPct: number;
  overallPct: number;
  mandatoryFilled: number;
  mandatoryTotal: number;
  overallFilled: number;
  overallTotal: number;
  pendingMandatory: CompletenessItem[];
  pendingRecommended: CompletenessItem[];
}) {
  const [open, setOpen] = useState(false);
  const pending = pendingMandatory.length + pendingRecommended.length;

  return (
    <div className="complete-meter">
      <button
        type="button"
        className="complete-meter-card"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="complete-meter-rings">
          <Meter label="Mandatory" pct={mandatoryPct} count={`${mandatoryFilled}/${mandatoryTotal}`} tone="maroon" />
          <Meter label="Overall" pct={overallPct} count={`${overallFilled}/${overallTotal}`} tone="gold" />
        </div>
        <div className="complete-meter-copy">
          <span className="complete-meter-kicker">Profile completeness</span>
          <p>
            {pending === 0
              ? "This biodata is fully filled."
              : pendingMandatory.length
                ? `${pendingMandatory.length} mandatory ${pendingMandatory.length === 1 ? "detail" : "details"} still needed.`
                : `${pendingRecommended.length} recommended ${pendingRecommended.length === 1 ? "detail" : "details"} still empty.`}
          </p>
          <span className="complete-meter-hint">
            {pending === 0 ? "View checklist" : open ? "Hide pending details" : "See pending details"}
          </span>
        </div>
      </button>
      {open ? (
        <div className="complete-meter-panel">
          {pending === 0 ? (
            <p className="complete-meter-empty">Nothing pending on this profile.</p>
          ) : (
            <>
              <PendingGroup
                title="Mandatory still needed"
                items={pendingMandatory}
                profileId={profileId}
                empty="All mandatory details are filled."
              />
              <PendingGroup
                title="Recommended still empty"
                items={pendingRecommended}
                profileId={profileId}
                empty="All recommended details are filled."
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Meter({
  label,
  pct,
  count,
  tone,
}: {
  label: string;
  pct: number;
  count: string;
  tone: "maroon" | "gold";
}) {
  const value = Math.min(100, Math.max(0, pct));
  return (
    <div
      className={`complete-ring complete-ring-${tone}`}
      style={{ ["--pct" as string]: value }}
      aria-label={`${label} ${value} percent, ${count} filled`}
    >
      <div className="complete-ring-face">
        <strong>{value}%</strong>
        <span>{label}</span>
        <small>{count}</small>
      </div>
    </div>
  );
}

function PendingGroup({
  title,
  items,
  profileId,
  empty,
}: {
  title: string;
  items: CompletenessItem[];
  profileId: string;
  empty: string;
}) {
  return (
    <section>
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <span>{item.label}</span>
              <Link href={`/app/profiles/${profileId}?edit=1&section=${item.section}`}>
                Edit {SECTION_TITLES[item.section as ProfileEditTarget]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
