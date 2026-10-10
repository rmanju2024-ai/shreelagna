"use client";

import { useEffect, useMemo, useState } from "react";
import { dropPushSubscription, savePushSubscription } from "@/app/app/alerts/push-actions";
import { NavGlyph } from "@/components/nav-icons";
import { useInstallApp } from "@/components/install-app";

function vapidBytes(publicKey: string): Uint8Array {
  const padding = "=".repeat((4 - (publicKey.length % 4)) % 4);
  const raw = atob((publicKey + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function permissionState(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission;
}

export function PushAlertsControl({ compact = false }: { compact?: boolean }) {
  const install = useInstallApp();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
  const [status, setStatus] = useState<NotificationPermission | "unsupported" | "saving">("unsupported");
  const [note, setNote] = useState("");
  const iosNeedsHome = Boolean(install?.ios && !install.standalone);

  useEffect(() => {
    setStatus(permissionState());
  }, []);

  const label = useMemo(() => {
    if (!publicKey) return "Alerts on this device need a VAPID key from house.";
    if (iosNeedsHome) return "On iPhone, Add to Home Screen first, then open Shree Lagna from the icon (iOS 16.4+).";
    if (status === "granted") return "Device alerts are on.";
    if (status === "denied") return "Notifications are blocked in the browser. Allow them for this site, then try again.";
    return "Get a banner when someone views, shortlists, or sends interest.";
  }, [iosNeedsHome, publicKey, status]);

  async function enable() {
    setNote("");
    if (!publicKey) {
      setNote("House has not set NEXT_PUBLIC_VAPID_PUBLIC_KEY yet.");
      return;
    }
    if (iosNeedsHome) {
      await install?.install();
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      setNote("This browser cannot receive Web Push.");
      return;
    }
    setStatus("saving");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission);
        setNote(permission === "denied" ? "Permission was declined." : "Permission was not granted.");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidBytes(publicKey) as BufferSource,
        }));
      const json = subscription.toJSON();
      const endpoint = json.endpoint ?? subscription.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        setStatus("default");
        setNote("The browser did not return push keys.");
        return;
      }
      const saved = await savePushSubscription({
        endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent,
      });
      if (!saved.ok) {
        setStatus("default");
        setNote(saved.error);
        return;
      }
      setStatus("granted");
      setNote("Alerts are on for this device.");
    } catch (error) {
      setStatus(permissionState() === "unsupported" ? "unsupported" : "default");
      setNote(error instanceof Error ? error.message : "Could not turn on alerts.");
    }
  }

  async function disable() {
    setNote("");
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await dropPushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("default");
      setNote("Device alerts are off.");
    } catch {
      setNote("Could not turn off alerts.");
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        role="menuitem"
        className="nav-menu-item"
        onClick={(event) => {
          event.stopPropagation();
          if (status === "granted") void disable();
          else void enable();
        }}
      >
        <span className="nav-3d-ico">
          <NavGlyph name="alerts" />
        </span>
        <span>{status === "granted" ? "Device alerts on" : "Turn on alerts"}</span>
      </button>
    );
  }

  return (
    <div className="push-alerts-card" role="region" aria-label="Device alerts">
      <p>
        <b>Turn on alerts</b>
        <span>{label}</span>
      </p>
      {status === "granted" ? (
        <button type="button" className="install-app-go" onClick={() => void disable()}>
          Turn off
        </button>
      ) : (
        <button type="button" className="install-app-go" onClick={() => void enable()} disabled={status === "saving"}>
          {status === "saving" ? "Turning on…" : "Enable notifications"}
        </button>
      )}
      {note ? <p className="push-alerts-note">{note}</p> : null}
    </div>
  );
}

export function PushAlertsMenuItem() {
  return <PushAlertsControl compact />;
}
