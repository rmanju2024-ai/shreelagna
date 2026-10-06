"use client";

import { refreshProfileCompleteness } from "@/app/app/profiles/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { stampPhotoFile } from "@/lib/media/stamp-photo";
import { removeStaleMedia } from "@/lib/media/discard-stale";
import { canAddPhoto, MAX_PHOTOS_PER_PROFILE } from "@/lib/profile/caps";
import { btnGhost, cardClass } from "@/lib/ui/classes";

type Photo = { id: string; storage_path: string };

export function PhotoManager({
  profileId,
  userId,
  photos,
  compact = false,
  watermark,
}: {
  profileId: string;
  userId: string;
  photos: Photo[];
  compact?: boolean;
  watermark?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropOver, setDropOver] = useState(false);
  const supabase = createClient();
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/`;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!canAddPhoto(photos.length)) {
      setError(`Maximum ${MAX_PHOTOS_PER_PROFILE} photos.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const remaining = MAX_PHOTOS_PER_PROFILE - photos.length;
      const picked = [...files].slice(0, remaining);
      for (const file of picked) {
        if (!file.type.startsWith("image/")) {
          setError("Only images, please.");
          continue;
        }
        const stamped = watermark ? await stampPhotoFile(file, watermark) : file;
        const path = `${userId}/${profileId}/${crypto.randomUUID()}-${stamped.name.replace(/[^\w.-]+/g, "")}`;
        const up = await supabase.storage.from("profile-media").upload(path, stamped, {
          upsert: false,
          contentType: stamped.type,
        });
        if (up.error) {
          setError(
            "Photos could not be saved. Please try again in a little while.",
          );
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
          await supabase.storage.from("profile-media").remove([path]);
          setError(ins.error.message);
          break;
        }
      }
      router.refresh();
      await refreshProfileCompleteness(profileId);
    } finally {
      setBusy(false);
    }
  }

  async function replace(photo: Photo, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only images, please.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const stamped = watermark ? await stampPhotoFile(file, watermark) : file;
      const path = `${userId}/${profileId}/${crypto.randomUUID()}-${stamped.name.replace(/[^\w.-]+/g, "")}`;
      const up = await supabase.storage.from("profile-media").upload(path, stamped, {
        upsert: false,
        contentType: stamped.type,
      });
      if (up.error) {
        setError("Photos could not be saved. Please try again in a little while.");
        return;
      }
      const ins = await supabase.from("media").insert({
        profile_id: profileId,
        kind: "photo",
        status: "approved",
        storage_path: path,
        is_primary: photos[0]?.id === photo.id,
        byte_size: stamped.size,
      });
      if (ins.error) {
        await supabase.storage.from("profile-media").remove([path]);
        setError(ins.error.message);
        return;
      }
      await removeStaleMedia(supabase, [photo]);
      router.refresh();
      await refreshProfileCompleteness(profileId);
    } finally {
      setBusy(false);
    }
  }

  async function remove(photo: Photo) {
    setBusy(true);
    await removeStaleMedia(supabase, [photo]);
    setBusy(false);
    await refreshProfileCompleteness(profileId);
    router.refresh();
  }

  return (
    <div className={compact ? "mt-6" : "mt-10"}>
      {compact ? null : (
        <>
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Photographs</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            One clear photograph is enough. More pictures are optional.
          </p>
        </>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {photos.map((p) => (
          <figure key={p.id} className={`${cardClass} overflow-hidden !p-0`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${publicBase}${p.storage_path}`}
              alt=""
              className="aspect-[3/4] w-full object-cover"
            />
            <button type="button" className={`${btnGhost} m-3 w-[calc(100%-1.5rem)]`} disabled={busy} onClick={() => remove(p)}>
              Remove
            </button>
            <label className={`${btnGhost} mx-3 mb-3 w-[calc(100%-1.5rem)] text-center`}>
              Replace
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={busy}
                onChange={(e) => void replace(p, e.target.files)}
              />
            </label>
          </figure>
        ))}
        {canAddPhoto(photos.length) ? (
          <label
            className={`${cardClass} photo-drop ${dropOver ? "is-over" : ""} flex min-h-[16rem] cursor-pointer flex-col items-center justify-center px-4 text-center`}
            onDragOver={(e) => {
              e.preventDefault();
              setDropOver(true);
            }}
            onDragLeave={() => setDropOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropOver(false);
              onFiles(e.dataTransfer.files);
            }}
          >
            <span className="font-[family-name:var(--font-display)] text-xl">
              {busy ? "Saving…" : dropOver ? "Release to add" : "Drop a photo"}
            </span>
            <span className="mt-2 text-sm text-[var(--muted)]">or choose a file · JPEG, PNG, WebP</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}
    </div>
  );
}
