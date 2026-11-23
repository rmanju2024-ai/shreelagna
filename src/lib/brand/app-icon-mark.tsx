/** Home-screen and Apple icon. Heart, name, and tagline — not the letters MC. */
export function AppIconMark({ size }: { size: number }) {
  const heart = Math.round(size * (size >= 512 ? 0.42 : 0.5));
  const showName = size >= 180;
  const showTag = size >= 180;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #fffaf2 0%, #f6e4c8 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "78%",
          height: "78%",
        }}
      >
        <svg width={heart} height={Math.round(heart * 0.94)} viewBox="0 0 72 68">
          <path d="M36 60 C22 52 6 40 4 24 3 13 11 5 20 5 26 5 31 9 36 16" fill="#a02030" />
          <path d="M36 60 C50 52 66 40 68 24 69 13 61 5 52 5 46 5 41 9 36 16" fill="#e8b23a" />
        </svg>
        {showName ? (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(size * 0.03),
              color: "#6f1d1b",
              fontSize: Math.round(size * 0.078),
              fontFamily: "Georgia, serif",
              letterSpacing: "-0.02em",
            }}
          >
            Marriage Connect
          </div>
        ) : null}
        {showTag ? (
          <div
            style={{
              display: "flex",
              marginTop: Math.round(size * 0.018),
              color: "#8a5a18",
              fontSize: Math.round(size * 0.048),
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
