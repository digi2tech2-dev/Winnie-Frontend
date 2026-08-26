import assert from "node:assert/strict";
import test from "node:test";
import { getPurchaseStatusCopy } from "./purchaseStatus.js";

test("PROCESSING order copy does not claim successful top-up", () => {
  const copy = getPurchaseStatusCopy("PROCESSING", true);

  assert.equal(copy.isCompleted, false);
  assert.equal(copy.title, "طلبك قيد التنفيذ");
  assert.equal(copy.heading, "طلبك قيد التنفيذ");
});

test("COMPLETED order copy confirms successful top-up", () => {
  const copy = getPurchaseStatusCopy("COMPLETED", true);

  assert.equal(copy.isCompleted, true);
  assert.equal(copy.heading, "تم الشحن بنجاح!");
});
