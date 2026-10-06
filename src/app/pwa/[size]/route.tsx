import { ImageResponse } from "next/og";

export const runtime = "edge";

const SIZES = new Set([192, 512]);

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  const px = SIZES.has(size) ? size : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6f1d1b",
          color: "#f6f1e8",
          fontSize: Math.round(px * 0.42),
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.04em",
        }}
      >
        SL
      </div>
    ),
    { width: px, height: px },
  );
}
