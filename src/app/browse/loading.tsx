export default function BrowseLoading() {
  return (
    <div className="sx-stage" aria-busy="true">
      <div className="sx-skel sx-skel-hero" />
      <div className="sx-skel-row">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="sx-skel sx-skel-chip" />
        ))}
      </div>
      <div className="sx-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="sx-skel sx-skel-card" />
        ))}
      </div>
    </div>
  );
}
