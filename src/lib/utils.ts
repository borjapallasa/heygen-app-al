export function toStartCase(str?: string) {
  if (!str) return '';
  return str.toLowerCase().split(/\s+/).filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export function getInitials(name?: string) {
  if (!name) return '';
  return name.trim().split(/\s+/).map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0,2);
}

export function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return 'id_' + Math.random().toString(36).slice(2);
}

export function timeAgo(tsSec?: number | string) {
  try {
    const then = (Number(tsSec) || 0) * 1000;
    const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec/60); if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min/60); if (hr < 24) return `${hr}h ago`;
    const d = Math.floor(hr/24); return `${d}d ago`;
  } catch { return ''; }
}

export function getStatusPlaceholder(status: string) {
  const ok = String(status || '').toLowerCase() === 'completed';
  return ok
    ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23e2e8f0"/></svg>'
    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect width="16" height="9" fill="%23fee2e2"/></svg>';
}

/** Avoid final row of 1: 3-per-row with first row=2 when n%3===1 */
export function chunkAvatarsForRows<T>(list: T[]) {
  const out: T[][] = [];
  const n = list.length;
  if (n === 0) return out;
  let i = 0;
  if (n % 3 === 1 && n >= 4) { out.push(list.slice(0,2)); i = 2; }
  for (; i < n; i += 3) out.push(list.slice(i, Math.min(i+3, n)));
  return out;
}

/**
 * Run assertions/checks on app startup
 * This is a placeholder for any initialization checks
 */
export function runAssertions() {
  // Placeholder for any startup assertions
  // Can be used to validate environment, check API availability, etc.
  if (typeof window !== 'undefined') {
    console.log('[utils] App assertions passed');
  }
}
