import assert from "node:assert/strict";
import test from "node:test";
import { allTrainingLessons, findTrainingLesson, searchTrainingLessons, trainingCategories } from "@/content/training/catalog";
import { permissionForTrainingRoute } from "@/content/training/routes";

test("training catalog contains every requested category", () => {
  assert.equal(trainingCategories.length, 15);
  for (const category of trainingCategories) {
    assert.ok(allTrainingLessons.some((lesson) => lesson.category === category.key), `Missing lessons for ${category.key}`);
  }
});

test("training search finds Sinhala and English keywords", () => {
  assert.ok(searchTrainingLessons("Supplier").some((lesson) => lesson.slug === "supplier-payment"));
  assert.ok(searchTrainingLessons("ඖෂධ").some((lesson) => lesson.slug === "product-to-sale"));
  assert.ok(searchTrainingLessons("FEFO").some((lesson) => lesson.slug === "fefo"));
});

test("unknown lesson slug returns undefined", () => {
  assert.equal(findTrainingLesson("scenarios", "does-not-exist"), undefined);
  assert.equal(findTrainingLesson("modules", "does-not-exist"), undefined);
});

test("operational links always declare their permission boundary when needed", () => {
  for (const lesson of allTrainingLessons.filter((item) => item.relatedRoute && item.relatedRoute !== "/login" && !item.relatedRoute.startsWith("/training"))) {
    assert.ok(lesson.requiredPermissions.length > 0 || lesson.slug === "daily-operations", `${lesson.key} has an unbounded route`);
  }
});

test("operational links resolve to the destination route permission", () => {
  assert.equal(permissionForTrainingRoute("/stock/grn"), "procurement.grn.manage");
  assert.equal(permissionForTrainingRoute("/stock/batches"), "inventory.stock.read");
  assert.equal(permissionForTrainingRoute("/suppliers/payments"), "suppliers.payments.read");
  assert.equal(permissionForTrainingRoute("/training/glossary"), null);
});
