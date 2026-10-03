export default function AppLoading() {
  return (
    <div className="app-route-loading" aria-busy="true" aria-live="polite">
      <div className="app-route-loading-copy">
        <p>Your Shree Lagna</p>
        <h2>Setting up your next step</h2>
      </div>
      <div className="app-route-loading-hero" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="app-route-loading-card" />)}
      </div>
    </div>
  );
}
