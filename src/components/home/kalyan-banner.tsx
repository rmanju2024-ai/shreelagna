export function KalyanBanner({
  intensity = "hero",
}: {
  intensity?: "hero" | "wash";
}) {
  const hero = intensity === "hero";
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/shiva-parvati-kalyan-banner.png"
        alt=""
        decoding="async"
        fetchPriority={hero ? "high" : "low"}
        className={hero ? "anim-kenburns absolute inset-[-8%] h-[116%] w-[116%] max-w-none object-cover" : "absolute inset-0 h-full w-full object-cover opacity-25"}
      />
      {hero ? (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,8,6,0.78)_0%,rgba(18,8,6,0.42)_42%,rgba(18,8,6,0.22)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,8,6,0.35)_0%,transparent_28%,rgba(18,8,6,0.55)_100%)]" />
          <span className="lamp lamp-a" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[var(--paper)]/82" />
      )}
    </div>
  );
}
