export function DeskPaneFallback() {
  return (
    <div className="desk-panel desk-pane-loading" aria-busy="true">
      <p className="browse-kicker">House desk</p>
      <p className="desk-empty">Opening…</p>
    </div>
  );
}
