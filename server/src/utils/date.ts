/**
 * Parse a user/automation-supplied date string safely. Accepts ISO
 * `YYYY-MM-DD`, `DD/MM/YYYY` and `DD-MM-YYYY`. Returns undefined for empty or
 * unparseable input instead of producing an Invalid Date (which would crash a
 * Mongoose save). Never throws.
 */
export function parseDateInput(input?: string | null): Date | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;

  // ISO: YYYY-MM-DD (optionally with time)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  // Day-first: DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    const d = new Date(year, month - 1, day);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  // Fallback: let the engine try, but reject Invalid Date.
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
