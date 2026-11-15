export default function Loading() {
  return (
    <section className="wc-welcome wc-loading-welcome" aria-live="polite">
      <div className="wc-loading-orbit" aria-hidden>
        <span>✦</span>
        <i />
      </div>
      <div>
        <p className="browse-kicker">Your circle</p>
        <h2>Opening chat</h2>
        <p>Loading this conversation.</p>
      </div>
    </section>
  );
}
