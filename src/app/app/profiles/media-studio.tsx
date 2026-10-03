"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { refreshProfileCompleteness, saveIntroChoice } from "@/app/app/profiles/actions";
import { MAX_INTRO_SECONDS } from "@/lib/profile/caps";
import { btnGhost, btnPrimary, cardClass } from "@/lib/ui/classes";
import { MediaMark } from "@/app/app/profiles/media-mark";

type Clip = { id: string; storage_path: string; kind?: string };

function formatVoiceTime(seconds: number) {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function VoicePlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const probingRef = useRef(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    setCurrent(0);
    setDuration(0);
    setPlaying(false);
    probingRef.current = false;

    const applyDuration = (value: number) => {
      if (Number.isFinite(value) && value > 0) setDuration(value);
    };

    const probeDuration = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        applyDuration(el.duration);
        return;
      }
      if (probingRef.current) return;
      probingRef.current = true;
      const finish = () => {
        el.removeEventListener("timeupdate", finish);
        el.removeEventListener("seeked", finish);
        applyDuration(el.duration);
        el.currentTime = 0;
        probingRef.current = false;
      };
      el.addEventListener("timeupdate", finish);
      el.addEventListener("seeked", finish);
      try {
        el.currentTime = 1e101;
      } catch {
        probingRef.current = false;
      }
    };

    const onTime = () => {
      if (probingRef.current) return;
      setCurrent(el.currentTime || 0);
      applyDuration(el.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      if (Number.isFinite(el.duration) && el.duration > 0) setCurrent(el.duration);
    };

    el.addEventListener("loadedmetadata", probeDuration);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    if (el.readyState >= 1) probeDuration();

    return () => {
      el.removeEventListener("loadedmetadata", probeDuration);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const ratio = duration > 0 ? Math.min(1, current / duration) : 0;

  return (
    <div className="voice-player">
      <audio ref={audioRef} src={src} preload="auto" />
      <button
        type="button"
        className="voice-play"
        aria-label={playing ? "Pause" : "Play"}
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (el.paused) void el.play();
          else el.pause();
        }}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <span className="voice-time">{formatVoiceTime(current)}</span>
      <input
        type="range"
        className="voice-seek"
        min={0}
        max={duration > 0 ? duration : 1}
        step={0.05}
        value={duration > 0 ? Math.min(current, duration) : 0}
        disabled={duration <= 0}
        aria-label="Voice progress"
        style={{ ["--voice-progress" as string]: `${ratio * 100}%` }}
        onChange={(e) => {
          const next = Number(e.target.value);
          const el = audioRef.current;
          if (el && Number.isFinite(next)) el.currentTime = next;
          setCurrent(next);
        }}
      />
      <span className="voice-time">{duration > 0 ? formatVoiceTime(duration) : "--:--"}</span>
    </div>
  );
}

export function IntroStudio({
  profileId,
  userId,
  video,
  audio,
  hasAbout: _hasAbout = false,
  editable = false,
  offer,
  watermark,
  onStored,
  onCleared,
}: {
  profileId: string;
  userId?: string;
  video: Clip | null;
  audio: Clip | null;
  hasAbout?: boolean;
  editable?: boolean;
  offer?: "video" | "audio";
  watermark?: string;
  onStored?: () => void;
  onCleared?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<"video" | "audio" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [clipVideo, setClipVideo] = useState<Clip | null>(video);
  const [clipAudio, setClipAudio] = useState<Clip | null>(audio);
  const [preview, setPreview] = useState<{ kind: "video" | "audio"; url: string } | null>(null);

  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  useEffect(() => {
    return () => {
      stopTracks();
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const supabase = createClient();
  const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-media/`;

  function stopTracks() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function pickRecorderMime(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
    return types.find((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) ?? "";
  }

  function readDuration(file: File, kind: "video" | "audio"): Promise<number | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const el = document.createElement(kind);
      el.preload = "metadata";
      const finish = (value: number | null) => {
        URL.revokeObjectURL(url);
        resolve(value);
      };
      const timer = window.setTimeout(() => finish(null), 800);
      el.onloadedmetadata = () => {
        window.clearTimeout(timer);
        const d = el.duration;
        finish(Number.isFinite(d) ? d : null);
      };
      el.onerror = () => {
        window.clearTimeout(timer);
        finish(null);
      };
      el.src = url;
    });
  }

  function srcFor(kind: "video" | "audio", clip: Clip | null) {
    if (preview?.kind === kind) return preview.url;
    if (clip?.storage_path) return `${publicBase}${clip.storage_path}`;
    return "";
  }

  async function saveFile(kind: "video" | "audio", file: File) {
    if (!editable || !userId) return;
    setBusy(true);
    setError(null);
    const localUrl = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return { kind, url: localUrl };
    });
    if (kind === "video") setClipVideo({ id: "local", storage_path: "", kind: "video" });
    else setClipAudio({ id: "local", storage_path: "", kind: "audio" });
    try {
      const existing = kind === "audio" ? clipAudio : clipVideo;
      const safeName = file.name.replace(/[^\w.-]+/g, "") || (kind === "audio" ? "voice.webm" : "clip.mp4");
      const path = `${userId}/${profileId}/${kind}-${crypto.randomUUID()}-${safeName}`;
      const [up, seconds] = await Promise.all([
        supabase.storage.from("profile-media").upload(path, file, {
          upsert: false,
          contentType: file.type || (kind === "audio" ? "audio/webm" : "video/mp4"),
        }),
        readDuration(file, kind),
      ]);
      if (seconds && seconds > MAX_INTRO_SECONDS) {
        await supabase.storage.from("profile-media").remove([path]);
        setError(`Please keep the ${kind === "audio" ? "voice" : "video"} under three minutes.`);
        if (kind === "video") setClipVideo(video);
        else setClipAudio(audio);
        return;
      }
      if (up.error) {
        setError("This file could not be saved just now.");
        if (kind === "video") setClipVideo(video);
        else setClipAudio(audio);
        return;
      }
      const ins = await supabase
        .from("media")
        .insert({
          profile_id: profileId,
          kind,
          status: "approved",
          storage_path: path,
          is_primary: false,
          byte_size: file.size,
          duration_seconds: seconds ?? null,
        })
        .select("id, storage_path, kind")
        .maybeSingle();
      if (ins.error || !ins.data) {
        setError("This file could not be stored.");
        if (kind === "video") setClipVideo(video);
        else setClipAudio(audio);
        return;
      }
      if (kind === "video") setClipVideo(ins.data);
      else setClipAudio(ins.data);
      const selected = await saveIntroChoice(profileId, kind);
      if (!selected.ok) {
        setError(selected.error);
      } else {
        onStored?.();
      }
      void refreshProfileCompleteness(profileId);
      if (existing?.id && existing.id !== "local" && existing.storage_path) {
        void supabase.from("media").delete().eq("id", existing.id);
        void supabase.storage.from("profile-media").remove([existing.storage_path]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onIntro(kind: "video" | "audio", files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    await saveFile(kind, file);
  }

  async function startRecording() {
    if (!editable || !userId || recording || busy) return;
    setError(null);
    if (!window.isSecureContext) {
      setError("Recording needs a secure page (https or localhost). You can still upload a file.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record. Please upload a file instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickRecorderMime();
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = (rec.mimeType || "audio/webm").split(";")[0];
        const blob = new Blob(chunksRef.current, { type });
        stopTracks();
        if (blob.size < 800) {
          setError("Nothing was captured. Please try again, or upload a file.");
          return;
        }
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        void saveFile("audio", new File([blob], `voice.${ext}`, { type }));
      };
      rec.start(250);
      setRecording(true);
      setElapsed(0);
    } catch (err) {
      stopTracks();
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotFoundError") {
        setError("No microphone was found. Please connect one, or upload a file.");
      } else if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError("Please allow the microphone in the browser address bar, then try Start recording again. You can also upload a file.");
      } else {
        setError("The microphone could not be used. Please allow access, or upload a file.");
      }
    }
  }

  function stopRecording() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const rec = recRef.current;
    setRecording(false);
    if (rec && rec.state !== "inactive") rec.stop();
    recRef.current = null;
  }

  useEffect(() => {
    if (!recording) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [recording]);

  useEffect(() => {
    if (recording && elapsed >= MAX_INTRO_SECONDS) stopRecording();
  }, [recording, elapsed]);

  async function remove(item: Clip) {
    if (!editable) return;
    setBusy(true);
    if (item.kind === "audio" || offer === "audio") setClipAudio(null);
    else setClipVideo(null);
    setPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    onCleared?.();
    void refreshProfileCompleteness(profileId);
    if (item.id !== "local" && item.storage_path) {
      void supabase.from("media").delete().eq("id", item.id);
      void supabase.storage.from("profile-media").remove([item.storage_path]);
    }
    setBusy(false);
  }

  const showVideo = (!offer || offer === "video") && (editable || Boolean(clipVideo));
  const showAudio = (!offer || offer === "audio") && (editable || Boolean(clipAudio));
  const videoSrc = srcFor("video", clipVideo);
  const audioSrc = srcFor("audio", clipAudio);
  if (!showVideo && !showAudio) return null;

  return (
    <div className="album-intros">
      {showVideo ? (
      <div className={`${cardClass} album-video`}>
        <p className="album-kicker">Video</p>
        {clipVideo ? (
          <div className="media-preview">
            <video
              controls
              playsInline
              preload="metadata"
              src={videoSrc}
            />
            <MediaMark line={watermark} />
            {busy ? <p className="album-kicker">Saving…</p> : null}
          </div>
        ) : editable ? (
          <label className="media-preview media-preview-empty album-add">
            <p>{busy ? "Saving…" : "No video yet"}</p>
            <span>Short clip, up to 3 minutes</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="sr-only"
              disabled={busy}
              onChange={(e) => onIntro("video", e.target.files)}
            />
          </label>
        ) : (
          <div className="media-preview media-preview-empty">
            <p>No video yet</p>
          </div>
        )}
        <div className="media-preview-actions">
          {clipVideo ? (
            <button type="button" className={btnGhost} onClick={() => setOpen("video")}>
              View full
            </button>
          ) : null}
          {editable && clipVideo ? (
            <button type="button" className={btnGhost} disabled={busy} onClick={() => remove(clipVideo)}>
              Remove video
            </button>
          ) : null}
        </div>
      </div>
      ) : null}
      {showAudio ? (
      <div className={`${cardClass} voice-strip`}>
        <p className="album-kicker">Voice</p>
        {clipAudio ? (
          <div className="voice-row">
            <VoicePlayer src={audioSrc} />
            {editable ? (
              <button type="button" className={btnGhost} disabled={busy || recording} onClick={() => remove(clipAudio)}>
                Remove
              </button>
            ) : null}
          </div>
        ) : editable ? (
          <div className="voice-row text-sm text-[var(--muted)]">
            {recording ? (
              <>
                <p className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)] tabular-nums">
                  {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
                </p>
                <button type="button" className={btnPrimary} disabled={busy} onClick={stopRecording}>
                  Stop and save
                </button>
              </>
            ) : (
              <>
                <div className="voice-player voice-player-empty">
                  <span className="voice-play">▶</span>
                  <span className="voice-time">0:00</span>
                  <input type="range" className="voice-seek" min={0} max={1} value={0} disabled aria-hidden />
                  <span className="voice-time">0:00</span>
                </div>
                <button type="button" className={btnPrimary} disabled={busy} onClick={() => void startRecording()}>
                  Record
                </button>
                <label className="voice-upload">
                  Upload
                  <input
                    type="file"
                    accept="audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,.m4a,.mp3,.wav,.webm"
                    disabled={busy || recording}
                    onChange={(e) => onIntro("audio", e.target.files)}
                  />
                </label>
              </>
            )}
          </div>
        ) : (
          <div className="voice-row">
            <div className="voice-player voice-player-empty">
              <span className="voice-play">▶</span>
              <span className="voice-time">0:00</span>
              <input type="range" className="voice-seek" min={0} max={1} value={0} disabled aria-label="Voice progress" />
              <span className="voice-time">0:00</span>
            </div>
          </div>
        )}
      </div>
      ) : null}
      {error ? <p className="album-media-error">{error}</p> : null}
      {mounted && open === "video" && clipVideo
        ? createPortal(
            <div className="media-lightbox" role="dialog" aria-modal="true" aria-label="Video">
              <button type="button" className="media-lightbox-close" onClick={() => setOpen(null)}>
                Close
              </button>
              <div className="media-lightbox-stage">
                <div className="media-lightbox-frame">
                  <video controls autoPlay src={videoSrc} />
                  <MediaMark line={watermark} />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
      {null}
    </div>
  );
}
