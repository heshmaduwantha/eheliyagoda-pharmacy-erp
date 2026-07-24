import assert from "node:assert/strict";
import test from "node:test";
import {
  addCalendarMonths,
  daysUntilExpiry,
  getColomboToday,
  getExpiryStatus,
} from "./expiry";

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

test("classifies expiry dates using exclusive 30-day and six-calendar-month boundaries", () => {
  const today = day("2026-01-31");
  assert.equal(getExpiryStatus(day("2026-01-30"), today), "EXPIRED");
  assert.equal(getExpiryStatus(day("2026-01-31"), today), "CRITICAL_EXPIRY");
  assert.equal(getExpiryStatus(day("2026-03-01"), today), "CRITICAL_EXPIRY");
  assert.equal(getExpiryStatus(day("2026-02-28"), today), "CRITICAL_EXPIRY");
  assert.equal(getExpiryStatus(day("2026-03-02"), today), "NEAR_EXPIRY");
  assert.equal(getExpiryStatus(day("2026-07-30"), today), "NEAR_EXPIRY");
  assert.equal(getExpiryStatus(day("2026-07-31"), today), "NORMAL");
  assert.equal(getExpiryStatus(day("2026-08-01"), today), "NORMAL");
});

test("uses clamped calendar-month arithmetic across month ends and leap years", () => {
  assert.equal(addCalendarMonths(day("2026-08-31"), 6).toISOString().slice(0, 10), "2027-02-28");
  assert.equal(addCalendarMonths(day("2024-08-31"), 6).toISOString().slice(0, 10), "2025-02-28");
  assert.equal(addCalendarMonths(day("2024-01-31"), 6).toISOString().slice(0, 10), "2024-07-31");
  assert.equal(addCalendarMonths(day("2024-08-31"), -6).toISOString().slice(0, 10), "2024-02-29");
});

test("uses Asia/Colombo for the operational today boundary while keeping date-only expiry dates stable", () => {
  const colomboToday = getColomboToday(new Date("2026-01-31T18:30:00.000Z"));
  assert.equal(colomboToday.toISOString().slice(0, 10), "2026-02-01");
  assert.equal(getExpiryStatus(day("2026-01-31"), colomboToday), "EXPIRED");
  assert.equal(getExpiryStatus(day("2026-02-01"), colomboToday), "CRITICAL_EXPIRY");
  assert.equal(daysUntilExpiry("2026-02-01", colomboToday), 0);
});
