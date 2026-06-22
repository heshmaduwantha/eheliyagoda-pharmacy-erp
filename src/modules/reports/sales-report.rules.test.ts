import assert from "node:assert/strict";
import test from "node:test";
import { countsAsRevenue } from "./sales-report.rules";

test("HELD sale does not count as revenue", () => {
  assert.equal(countsAsRevenue("HELD"), false);
});

test("VOIDED sale does not count as revenue", () => {
  assert.equal(countsAsRevenue("VOIDED"), false);
});

test("COMPLETED sale counts as revenue", () => {
  assert.equal(countsAsRevenue("COMPLETED"), true);
});
