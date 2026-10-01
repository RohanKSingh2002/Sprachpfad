// Small helpers shared across the app.

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escape text for use inside HTML. */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Normalise an answer before comparing: ignores case, punctuation, extra spaces and ae/oe/ue/ss spellings. */
export const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** A shuffled copy of a list. */
export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pad = (n) => String(n).padStart(2, "0");

/** Local calendar day as YYYY-MM-DD, used as the key in the practice log. */
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Today's day key. */
export const todayKey = () => dayKey(new Date());

const fromKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m: m - 1, d };
};

/** The day key `n` days after `key`. */
export function addDays(key, n) {
  const { y, m, d } = fromKey(key);
  return dayKey(new Date(y, m, d + n));
}

/** Whole days from day key `a` to day key `b` (negative when `b` is earlier). */
export function daysBetween(a, b) {
  const utc = (key) => {
    const { y, m, d } = fromKey(key);
    return Date.UTC(y, m, d);
  };
  return Math.round((utc(b) - utc(a)) / 86400000);
}

/** Current time as HH:MM for the station clock. */
export function clockText() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** German date, e.g. 01.10.2026 (or 01.10.26 with a short year). */
export const germanDate = (d, shortYear = false) =>
  `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${shortYear ? String(d.getFullYear()).slice(2) : d.getFullYear()}`;
