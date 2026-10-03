export function KalyanBanner({
  intensity = "hero",
  presentation = "cover",
  veil = true,
}: {
  intensity?: "hero" | "wash";
  /** Preserve the complete artwork instead of cropping it to fill a hero. */
  presentation?: "cover" | "complete";
  /** Keep artwork unobstructed when supporting copy is rendered outside it. */
  veil?: boolean;
}) {
  const hero = intensity === "hero";
  const complete = hero && presentation === "complete";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {complete ? (
        // A soft cover layer avoids empty side bands while the foreground image
        // remains fully visible and undistorted.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/graphics/shiva-parvati-kalyan-banner.png"
          alt=""
          decoding="async"
          className="absolute inset-[-4%] h-[108%] w-[108%] max-w-none object-cover opacity-45 blur-xl"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/shiva-parvati-kalyan-banner.png"
        alt=""
        decoding="async"
        fetchPriority={hero ? "high" : "low"}
        className={
          complete
            ? "absolute inset-0 h-full w-full object-contain opacity-95"
            : hero
              ? "anim-kenburns absolute inset-[-8%] h-[116%] w-[116%] max-w-none object-cover"
              : "absolute inset-0 h-full w-full object-cover opacity-25"
        }
      />
      {hero ? (
        veil ? (
          <>
            <div className={complete ? "absolute inset-0 bg-[linear-gradient(90deg,rgba(18,8,6,0.42)_0%,rgba(18,8,6,0.16)_48%,rgba(18,8,6,0.18)_100%)]" : "absolute inset-0 bg-[linear-gradient(90deg,rgba(18,8,6,0.78)_0%,rgba(18,8,6,0.42)_42%,rgba(18,8,6,0.22)_100%)]"} />
            <div className={complete ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(18,8,6,0.18)_0%,transparent_30%,rgba(18,8,6,0.32)_100%)]" : "absolute inset-0 bg-[linear-gradient(180deg,rgba(18,8,6,0.35)_0%,transparent_28%,rgba(18,8,6,0.55)_100%)]"} />
            <span className="lamp lamp-a" />
          </>
        ) : null
      ) : (
        <div className="absolute inset-0 bg-[var(--paper)]/82" />
      )}
    </div>
  );
}
