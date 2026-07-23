import assert from "node:assert/strict";
import test from "node:test";
import { addCalendarMonths } from "./expiry-alert.service";

test("six-month expiry threshold uses calendar-month end-of-month arithmetic", () => {
  const threshold = addCalendarMonths(new Date(2026, 7, 31), 6);
  assert.equal(threshold.getFullYear(), 2027);
  assert.equal(threshold.getMonth(), 1);
  assert.equal(threshold.getDate(), 28);
});
