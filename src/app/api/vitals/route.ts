export async function POST(request: Request) {
  try {
    const data = (await request.json()) as { name?: string; value?: number; page?: string };
    if (typeof data.name === "string" && typeof data.value === "number") {
      console.log(`[vitals] ${String(data.page ?? "").slice(0, 80)} ${data.name.slice(0, 8)}=${data.value}`);
    }
  } catch {
    /* ignore bad beacons */
  }
  return new Response(null, { status: 204 });
}
