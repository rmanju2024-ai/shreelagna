export function HoneymoonScene() {
  return (
    <div className="honeymoon-scene" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="honeymoon-photo" src="/graphics/honeymoon-valley.jpg" alt="" fetchPriority="low" loading="lazy" decoding="async" />
      <div className="honeymoon-sun" />
      <div className="honeymoon-mist is-a" />
      <div className="honeymoon-mist is-b" />
      <div className="honeymoon-forest" />
      <div className="honeymoon-river" />
      <div className="honeymoon-veil" />
    </div>
  );
}
