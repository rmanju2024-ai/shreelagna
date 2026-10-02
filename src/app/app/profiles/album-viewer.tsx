"use client";

import { refreshProfileCompleteness } from "@/app/app/profiles/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { stampPhotoFile } from "@/lib/media/stamp-photo";
import { canAddPhoto, MAX_PHOTOS_PER_PROFILE } from "@/lib/profile/caps";
import { cardClass } from "@/lib/ui/classes";

type Photo = { id: string; storage_path: string };

export function AlbumViewer({
  photos,
  profileId,
  userId,
  editable = false,
  framed = false,
  locked = false,
  gateExtras = false,
  watermark,
}: {
  photos: Photo[];
  profileId: string;
  userId?: string;
  editable?: boolean;
  framed?: boolean;
  locked?: boolean;
  gateExtras?: boolean;
  watermark?: string;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [lit, setLit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/`;
  const total = photos.length;
  const safeIndex = total ? Math.min(index, total - 1) : 0;
  const current = photos[safeIndex];
  const extraGated = Boolean(gateExtras && safeIndex > 0);

  function go(delta: number) {
    if (!total) return;
    setIndex((i) => {
      const next = (i + delta + total) % total;
      if (lit && gateExtras && next > 0) return i;
      return next;
    });
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!lit) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLit(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [lit, total]);

  async function onPhotos(files: FileList | null) {
    if (!editable || !userId) return;
    if (!files?.length) return;
    if (!canAddPhoto(photos.length)) {
      setError(`The album holds up to ${MAX_PHOTOS_PER_PROFILE} photographs.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const remaining = MAX_PHOTOS_PER_PROFILE - photos.length;
      for (const file of [...files].slice(0, remaining)) {
        if (!file.type.startsWith("image/")) {
          setError("Photographs should be JPEG, PNG or WebP.");
          continue;
        }
        const stamped = watermark ? await stampPhotoFile(file, watermark) : file;
        const path = `${userId}/${profileId}/photo-${crypto.randomUUID()}-${stamped.name.replace(/[^\w.-]+/g, "")}`;
        const up = await supabase.storage.from("profile-media").upload(path, stamped, {
          upsert: false,
          contentType: stamped.type,
        });
        if (up.error) {
          setError("This photograph could not be saved just now.");
          break;
        }
        const ins = await supabase.from("media").insert({
          profile_id: profileId,
          kind: "photo",
          status: "approved",
          storage_path: path,
          is_primary: photos.length === 0,
          byte_size: stamped.size,
        });
        if (ins.error) {
          setError("This photograph could not be stored.");
          break;
        }
      }
      await refreshProfileCompleteness(profileId);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrent() {
    if (!editable || !current) return;
    setBusy(true);
    await supabase.from("media").delete().eq("id", current.id);
    await supabase.storage.from("profile-media").remove([current.storage_path]);
    setIndex(0);
    setBusy(false);
    await refreshProfileCompleteness(profileId);
    router.refresh();
  }

  return (
    <div className={framed ? `${cardClass} album-book` : "album-book"}>
      <p className="album-kicker">Photographs (required)</p>
      {current ? (
        <figure className={`album-stage${extraGated ? " is-gated" : ""}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${publicBase}${current.storage_path}`}
            alt=""
            role={extraGated ? undefined : "button"}
            tabIndex={extraGated ? undefined : 0}
            onClick={() => {
              if (!extraGated) setLit(true);
            }}
            onKeyDown={(e) => {
              if (extraGated) return;
              if (e.key === "Enter" || e.key === " ") setLit(true);
            }}
          />
          {extraGated ? (
            <Link href="/app/plans" className="album-gate-veil">
              Subscribe to view album
            </Link>
          ) : null}
          {total > 1 ? (
            <>
              <button type="button" className="album-nav album-nav-prev" onClick={() => go(-1)} aria-label="Previous photograph">
                ‹
              </button>
              <button type="button" className="album-nav album-nav-next" onClick={() => go(1)} aria-label="Next photograph">
                ›
              </button>
              <p className="album-count">
                {safeIndex + 1} / {total}
              </p>
            </>
          ) : null}
        </figure>
      ) : locked ? (
        <div className="album-stage album-empty">
          <span className="album-lock" aria-hidden>🔒</span>
          <p>Photographs are shown after interest is accepted</p>
        </div>
      ) : editable ? (
        <label className="album-stage album-empty album-add">
          <p>{busy ? "Saving…" : "Add a photograph to complete the profile"}</p>
          <span>JPEG, PNG or WebP — at least one is required</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => onPhotos(e.target.files)}
          />
        </label>
      ) : (
        <div className="album-stage album-empty">
          <p>No photographs yet</p>
        </div>
      )}

      {editable || framed ? (
      <div className="album-toolbar">
        {editable && current ? (
          <button type="button" className="album-tool" disabled={busy} onClick={removeCurrent}>
            Remove this photograph
          </button>
        ) : null}
        {editable && canAddPhoto(photos.length) && current ? (
          <label className="album-tool album-tool-file">
            {busy ? "Saving…" : "Add to album"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => onPhotos(e.target.files)}
            />
          </label>
        ) : null}
      </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
      {mounted && lit && current
        ? createPortal(
            <div className="media-lightbox" role="dialog" aria-modal="true" aria-label="Photograph">
              <button type="button" className="media-lightbox-close" onClick={() => setLit(false)}>
                Close
              </button>
              <div className="media-lightbox-stage">
                <button type="button" className="media-lightbox-side is-prev" onClick={() => go(-1)} aria-label="Previous">
                  ‹
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${publicBase}${current.storage_path}`} alt="" />
                <button type="button" className="media-lightbox-side is-next" onClick={() => go(1)} aria-label="Next">
                  ›
                </button>
              </div>
              <p className="media-lightbox-count">
                {total ? `${safeIndex + 1} / ${total}` : ""}
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
