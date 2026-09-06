import assert from "node:assert/strict";
import test from "node:test";
import { startBatchPreviewRequest } from "./batch-preview-request";
import type { PosBatchPreview } from "./pos.types";

const preview: PosBatchPreview = {
  productId: "medicine", unitName: "Tablet", requestedQtyBase: "1.000",
  totalAvailableQtyBase: "184.000", canFulfil: true, candidates: [], generatedAt: "2026-09-06T00:00:00Z",
};
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("a committed row starts its batch request immediately and receives the response", async () => {
  let calls = 0;
  let received: PosBatchPreview | undefined;
  startBatchPreviewRequest(async () => { calls++; return preview; }, (result) => { received = result; }, () => assert.fail("unexpected failure"));
  assert.equal(calls, 1);
  await flush();
  assert.equal(received, preview);
});

test("quantity/unit change or removal cancels late responses, including same-row re-add", async () => {
  let resolveOld!: (value: PosBatchPreview) => void;
  const results: PosBatchPreview[] = [];
  const cancel = startBatchPreviewRequest(() => new Promise((resolve) => { resolveOld = resolve; }), (result) => results.push(result), () => assert.fail("unexpected failure"));
  cancel();
  const latest = { ...preview, requestedQtyBase: "2.000" };
  startBatchPreviewRequest(async () => latest, (result) => results.push(result), () => assert.fail("unexpected failure"));
  await flush();
  resolveOld(preview);
  await flush();
  assert.deepEqual(results, [latest]);
});

test("null and failed requests report errors and a retry can succeed", async () => {
  let errors = 0;
  let successes = 0;
  startBatchPreviewRequest(async () => null, () => successes++, () => errors++);
  startBatchPreviewRequest(async () => { throw new Error("network failure"); }, () => successes++, () => errors++);
  await flush();
  assert.equal(errors, 2);
  startBatchPreviewRequest(async () => preview, () => successes++, () => errors++);
  await flush();
  assert.equal(successes, 1);
});

test("cancelled failures do not update an unmounted or changed cart row", async () => {
  let reject!: (error: Error) => void;
  const cancel = startBatchPreviewRequest(() => new Promise((_, fail) => { reject = fail; }), () => assert.fail(), () => assert.fail());
  cancel();
  reject(new Error("late failure"));
  await flush();
});
