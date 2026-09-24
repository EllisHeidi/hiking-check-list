const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export const fmtInt = (n: number) => nf0.format(n);
export const fmtDec = (n: number) => nf1.format(n);
export const fmtKm = (n: number | null | undefined) => (n == null ? "—" : `${nf1.format(n)} km`);
export const fmtM = (n: number | null | undefined) => (n == null ? "—" : `${nf0.format(n)} m`);

export function fmtDuration(minutes: number | null | undefined) {
  if (minutes == null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function fmtDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!iso) return "—";
  // Plain calendar dates are formatted in UTC so they never shift by a day.
  const isDateOnly = iso.length === 10;
  const d = isDateOnly ? new Date(`${iso}T00:00:00Z`) : new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(isDateOnly ? { timeZone: "UTC" } : {}),
    ...opts,
  });
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(iso);
}

export const displayName = (p: { display_name: string | null; username: string }) =>
  p.display_name?.trim() || p.username;

export const toNumber = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v);
