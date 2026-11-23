/** Launcher icon and install splash. Heart logo, never the letters MC. */
export function AppIconMark({ size }: { size: number }) {
  const splash = size >= 512;
  const heart = Math.round(size * (splash ? 0.34 : 0.62));
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fffaf2",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: splash ? "86%" : "70%",
        }}
      >
        <svg width={heart} height={Math.round(heart * 0.94)} viewBox="0 0 72 68">
          <path d="M36 60 C22 52 6 40 4 24 3 13 11 5 20 5 26 5 31 9 36 16" fill="#a02030" />
          <path d="M36 60 C50 52 66 40 68 24 69 13 61 5 52 5 46 5 41 9 36 16" fill="#e8b23a" />
        </svg>
        {splash ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 28,
              color: "#6f1d1b",
              fontSize: 42,
              fontFamily: "Georgia, serif",
            }}
          >
            <span>Marriage Connect</span>
            <span style={{ marginLeft: 8, color: "#1f8a32", fontSize: 36 }}>.in</span>
          </div>
        ) : null}
        {splash ? (
          <div
            style={{
              display: "flex",
              marginTop: 14,
              color: "#8a5a18",
              fontSize: 22,
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
            }}
          >
            Love Begins Here
          </div>
        ) : null}
      </div>
    </div>
  );
}
