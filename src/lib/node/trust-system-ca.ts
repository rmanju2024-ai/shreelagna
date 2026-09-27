import tls from "node:tls";

type SystemTls = typeof tls & {
  getCACertificates?: (type?: string) => string[];
  setDefaultCACertificates?: (certs: readonly string[]) => void;
};

let applied = false;
let result = false;

/** Windows (and some office proxies) put extra CAs in the OS store. Node does not use them unless we add them. */
export function trustSystemCa(): boolean {
  if (applied) return result;
  try {
    const t = tls as SystemTls;
    if (typeof t.getCACertificates !== "function" || typeof t.setDefaultCACertificates !== "function") {
      applied = true;
      result = false;
      return false;
    }
    const bundled = t.getCACertificates("bundled");
    const extra = t.getCACertificates("extra");
    const system = t.getCACertificates("system");
    t.setDefaultCACertificates([...bundled, ...extra, ...system]);
    applied = true;
    result = system.length > 0;
    return result;
  } catch {
    applied = true;
    result = false;
    return false;
  }
}
