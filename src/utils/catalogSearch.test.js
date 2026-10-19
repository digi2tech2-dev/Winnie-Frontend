import test from "node:test";
import assert from "node:assert/strict";
import { getCatalogSearchResults } from "./catalogSearch.js";

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
    categories: [categories[1]],
    products: [products[0]],
  });
  assert.deepEqual(getCatalogSearchResults(categories, products, ""), {
    categories: [],
    products: [],
  });
});
