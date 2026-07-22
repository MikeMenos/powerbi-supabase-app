import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HAS_TIMEZONE_RE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

/**
 * Parse API/DB timestamps for display.
 * Timezone-naive values (common from Postgres `timestamp` / PostgREST) are
 * treated as UTC, then shown in the browser's local timezone.
 */
function parseTimestamp(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;

  if (HAS_TIMEZONE_RE.test(raw)) {
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Normalize "YYYY-MM-DD HH:mm:ss.ssssss" → ISO, trim micros to millis, assume UTC.
  const withT = raw.includes("T") ? raw : raw.replace(" ", "T");
  const withMillis = withT.replace(/(\.\d{3})\d+/, "$1");
  const date = new Date(`${withMillis}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a calendar date as dd/mm/yyyy (no timezone shift for YYYY-MM-DD). */
export function formatDateDdMmYyyy(value: unknown): string | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const dateOnly = DATE_ONLY_RE.exec(raw);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}/${month}/${year}`;
  }

  const date = parseTimestamp(raw);
  if (!date) return null;
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Format a timestamp as dd/mm/yyyy HH:mm in local time (no seconds). */
export function formatDateTimeDdMmYyyyHm(value: unknown): string | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim();
  const dateOnly = DATE_ONLY_RE.exec(raw);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}/${month}/${year}`;
  }

  const date = parseTimestamp(raw);
  if (!date) return null;
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
