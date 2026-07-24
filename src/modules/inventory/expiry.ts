export const PHARMACY_TIME_ZONE = "Asia/Colombo";
export const CRITICAL_EXPIRY_DAYS = 30;
export const EXPIRY_WARNING_MONTHS = 6;

export type ExpiryStatus = "EXPIRED" | "CRITICAL_EXPIRY" | "NEAR_EXPIRY" | "NORMAL";

type CalendarDate = { year: number; month: number; day: number };

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function calendarDateFromDateOnly(value: Date | string): CalendarDate {
  if (typeof value === "string") {
    const match = dateOnlyPattern.exec(value);
    if (match) {
      return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    }
    return calendarDateInTimeZone(new Date(value), PHARMACY_TIME_ZONE);
  }

  // Prisma maps PostgreSQL DATE values to midnight UTC. Read its UTC fields so
  // a server running outside Colombo cannot shift an operational expiry date.
  return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

function calendarDateInTimeZone(value: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(byType.get("year")),
    month: Number(byType.get("month")),
    day: Number(byType.get("day")),
  };
}

function asDate(value: CalendarDate) {
  return new Date(Date.UTC(value.year, value.month - 1, value.day));
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Adds calendar months and clamps month-end dates (e.g. Aug 31 + 6 months = Feb 28/29). */
export function addCalendarMonths(value: Date, months: number) {
  const source = calendarDateFromDateOnly(value);
  const targetMonthIndex = source.month - 1 + months;
  const year = source.year + Math.floor(targetMonthIndex / 12);
  const month = ((targetMonthIndex % 12) + 12) % 12 + 1;
  return asDate({ year, month, day: Math.min(source.day, daysInMonth(year, month)) });
}

export function addCalendarDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Returns the current operational date at midnight UTC for safe DATE comparisons. */
export function getColomboToday(now = new Date()) {
  return asDate(calendarDateInTimeZone(now, PHARMACY_TIME_ZONE));
}

export function toDateOnly(value: Date | null) {
  if (!value) return null;
  const { year, month, day } = calendarDateFromDateOnly(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function daysUntilExpiry(expiryDate: Date | string | null, today = getColomboToday()) {
  if (!expiryDate) return null;
  return Math.round((asDate(calendarDateFromDateOnly(expiryDate)).getTime() - today.getTime()) / 86_400_000);
}

export function getExpiryStatus(expiryDate: Date | string | null, today = getColomboToday()): ExpiryStatus {
  if (!expiryDate) return "NORMAL";
  const expiry = asDate(calendarDateFromDateOnly(expiryDate));
  const criticalBoundary = addCalendarDays(today, CRITICAL_EXPIRY_DAYS);
  const warningBoundary = addCalendarMonths(today, EXPIRY_WARNING_MONTHS);

  if (expiry < today) return "EXPIRED";
  if (expiry < criticalBoundary) return "CRITICAL_EXPIRY";
  if (expiry < warningBoundary) return "NEAR_EXPIRY";
  return "NORMAL";
}

export function getExpiryDateWindows(today = getColomboToday()) {
  return {
    today,
    criticalBoundary: addCalendarDays(today, CRITICAL_EXPIRY_DAYS),
    threeMonthBoundary: addCalendarMonths(today, 3),
    sixMonthBoundary: addCalendarMonths(today, EXPIRY_WARNING_MONTHS),
  };
}

export function expiryStatusLabel(status: ExpiryStatus, daysRemaining: number | null) {
  if (status === "EXPIRED") return "Expired";
  if (status === "NORMAL") return "Valid";
  if (daysRemaining === 0) return "Expires today";
  if (daysRemaining != null) return `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  return status === "CRITICAL_EXPIRY" ? "Critical expiry" : "Near expiry";
}
