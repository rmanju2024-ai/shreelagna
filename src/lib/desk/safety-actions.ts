export function orderedProfilePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function parseSafetyEnforce(form: {
  hide?: unknown;
  block?: unknown;
  freeze?: unknown;
}): { hide: boolean; block: boolean; freeze: boolean } {
  const on = (value: unknown) => String(value ?? "") === "on" || String(value ?? "") === "true" || String(value ?? "") === "1";
  return { hide: on(form.hide), block: on(form.block), freeze: on(form.freeze) };
}
