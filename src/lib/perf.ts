/** Log slow server work so Vercel logs show which call is slow. */
export async function timed<T>(label: string, work: PromiseLike<T> | (() => PromiseLike<T>), slowMs = 300): Promise<T> {
  const start = Date.now();
  try {
    return await (typeof work === "function" ? work() : work);
  } finally {
    const ms = Date.now() - start;
    if (ms >= slowMs) console.warn(`[perf] ${label} ${ms}ms`);
  }
}
