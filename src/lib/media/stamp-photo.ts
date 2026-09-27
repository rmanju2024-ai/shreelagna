"use client";

export async function stampPhotoFile(file: File, line: string): Promise<File> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);
    const short = Math.min(canvas.width, canvas.height);
    const size = Math.max(22, Math.round(short * 0.048));
    const step = Math.round(short * 0.28);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-32 * Math.PI) / 180);
    ctx.font = `700 ${size}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 247, 234, 0.42)";
    ctx.shadowColor = "rgba(20, 8, 6, 0.28)";
    ctx.shadowBlur = Math.max(4, Math.round(size * 0.2));
    for (const y of [-step, 0, step]) ctx.fillText(line, 0, y);
    ctx.restore();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    bitmap.close();
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
