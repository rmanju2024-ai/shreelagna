import { ImageResponse } from "next/og";
import { AppIconMark } from "@/lib/brand/app-icon-mark";

export const runtime = "edge";

const SIZES = new Set([192, 512]);

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  const px = SIZES.has(size) ? size : 192;
  return new ImageResponse(<AppIconMark size={px} />, { width: px, height: px });
}
