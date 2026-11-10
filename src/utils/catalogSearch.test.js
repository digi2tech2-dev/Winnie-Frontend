import test from "node:test";
import assert from "node:assert/strict";
import { getCatalogSearchResults, getCategorySearchResults } from "./catalogSearch.js";

test("search returns matching subcategories and only products directly in main categories", () => {
  const categories = [
    { id: "main", title: "Games", parentId: null },
    { id: "child", title: "Game Cards", parentId: "main" },
    { id: "hidden", title: "Game Hidden", parentId: "main", isActive: false },
  ];
  const products = [
    { id: "direct", name: "Game Pass", categoryId: "main" },
    { id: "nested", name: "Game Coins", categoryId: "child", subCategoryId: "child" },
    { id: "hidden", name: "Game Code", categoryId: "main", isActive: false },
  ];

  assert.deepEqual(getCatalogSearchResults(categories, products, "game"), {
    categories: [categories[1], categories[0]],
    products: [products[0]],
  });
  assert.deepEqual(getCatalogSearchResults(categories, products, ""), {
    categories: [],
    products: [],
  });
});

test("category search supports normalized Arabic/English names and identifiers", () => {
  const categories = [
    { id: "main", title: "Games", parentId: null },
    { id: "child-1", title: "Game Cards", nameAr: "بطاقات الألعاب", slug: "game-cards", parentId: "main" },
    { id: "child-2", title: "Hidden", nameAr: "مخفي", parentId: "main", isActive: false },
  ];

  assert.equal(getCategorySearchResults(categories, "بطاقات الالعاب")[0].id, "child-1");
  assert.equal(getCategorySearchResults(categories, "game-cards")[0].id, "child-1");
  assert.deepEqual(getCategorySearchResults(categories, ""), []);
});

test("category search includes active parent categories for navigation", () => {
  const categories = [
    { id: "pubg", title: "PUBG", slug: "pubg", parentId: null, isActive: true },
    { id: "pubg-mobile", title: "PUBG Mobile", slug: "pubg-mobile", parentId: "pubg", isActive: true },
    { id: "hidden-parent-child", title: "PUBG Hidden", parentId: "hidden-parent", isActive: true },
    { id: "hidden-parent", title: "PUBG Hidden Parent", parentId: null, isActive: false },
  ];

  assert.deepEqual(getCategorySearchResults(categories, "PUBG").map((category) => category.id), ["pubg-mobile", "pubg"]);
});

test("real PUBG records remain searchable when the parent is omitted from a partial list", () => {
  const pubg = {
    _id: "65f0c4f7387abd79e3cb92b8",
    name: "PUBG",
    slug: "pubg",
    isActive: true,
    parentCategory: "6a4da4f7387abd79e3cb92b8",
  };

  assert.deepEqual(getCategorySearchResults([pubg], "PUBG"), [pubg]);
});

test("known inactive parents still suppress child categories", () => {
  const categories = [
    { _id: "inactive-child", name: "PUBG Hidden", parentCategory: "inactive-parent", isActive: true },
    { _id: "inactive-parent", name: "Hidden Games", parentCategory: null, isActive: false },
  ];

  assert.deepEqual(getCategorySearchResults(categories, "PUBG"), []);
});
