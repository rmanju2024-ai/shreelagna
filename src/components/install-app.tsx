"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { NavGlyph } from "@/components/nav-icons";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

type InstallApi = {
  canInstall: boolean;
  standalone: boolean;
  ios: boolean;
  install: () => Promise<void>;
};

const InstallContext = createContext<InstallApi | null>(null);
const HINT_KEY = "sl-install-hint";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

export function InstallAppRoot({ children }: { children?: React.ReactNode }) {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);
  const [banner, setBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStandalone(isStandalone());
    setIos(isIosDevice());
    try {
      setBanner(localStorage.getItem(HINT_KEY) !== "hide");
    } catch {
      setBanner(true);
    }
    function onPrompt(event: Event) {
      event.preventDefault();
      setPrompt(event as PromptEvent);
    }
    function onInstalled() {
      setPrompt(null);
      setStandalone(true);
      setHint(false);
      setBanner(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const api = useMemo<InstallApi>(
    () => ({
      canInstall: !standalone,
      standalone,
      ios,
      install: async () => {
        if (prompt) {
          await prompt.prompt();
          const choice = await prompt.userChoice;
          if (choice.outcome === "accepted") setPrompt(null);
          return;
        }
        setHint(true);
      },
    }),
    [prompt, ios, standalone],
  );

  function dismissBanner() {
    setBanner(false);
    try {
      localStorage.setItem(HINT_KEY, "hide");
    } catch {
      /* ignore */
    }
  }

  const showBanner = mounted && banner && !standalone && (Boolean(prompt) || ios);

  return (
    <InstallContext.Provider value={api}>
      {children}
      {showBanner
        ? createPortal(
            <div className="install-app-banner" role="region" aria-label="Install app">
              <p>
                <b>Add Shree Lagna</b>
                <span>Keep the house on your home screen.</span>
              </p>
              <button type="button" className="install-app-go" onClick={() => void api.install()}>
                Install
              </button>
              <button type="button" className="install-app-skip" onClick={dismissBanner} aria-label="Not now">
                ✕
              </button>
            </div>,
            document.body,
          )
        : null}
      {mounted && hint
        ? createPortal(
            <div className="install-app-sheet" role="dialog" aria-labelledby="install-app-title">
              <button type="button" className="install-app-scrim" aria-label="Close" onClick={() => setHint(false)} />
              <div className="install-app-card">
                <h2 id="install-app-title">Add to Home Screen</h2>
                <ol>
                  {ios ? (
                    <>
                      <li>Tap the Share button in Safari.</li>
                      <li>Scroll and tap Add to Home Screen.</li>
                      <li>Tap Add. Shree Lagna opens like an app.</li>
                    </>
                  ) : (
                    <>
                      <li>Open the browser menu (⋮ or Share).</li>
                      <li>Tap Install app or Add to Home Screen.</li>
                      <li>Confirm. Shree Lagna opens like an app.</li>
                    </>
                  )}
                </ol>
                <button type="button" className="install-app-go" onClick={() => setHint(false)}>
                  Got it
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </InstallContext.Provider>
  );
}

export function InstallAppMenuItem() {
  const api = useContext(InstallContext);
  if (!api || api.standalone || !api.canInstall) return null;
  return (
    <button
      type="button"
      role="menuitem"
      className="nav-menu-item"
      onClick={(event) => {
        event.stopPropagation();
        void api.install();
      }}
    >
      <span className="nav-3d-ico">
        <NavGlyph name="install" />
      </span>
      <span>Install app</span>
    </button>
  );
}
