import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HeaderSearchOverlay from "../components/HeaderSearchOverlay";
import { clearApiRequestCache } from "./client";
import { getCategories } from "./catalog";

const productionCategoryEnvelope = {
  success: true,
  data: {
    categories: [{
      _id: "6a92cbc9fd1b7b830172b174",
      name: "PUBG",
      slug: "pubg",
      isActive: true,
      parentCategory: "mobile-games",
    }],
  },
};

const jsonResponse = (payload) => ({
  ok: true,
  status: 200,
  headers: new Headers({ "content-type": "application/json" }),
  json: async () => payload,
});

describe("category search response envelope", () => {
  afterEach(() => {
    cleanup();
    clearApiRequestCache();
    vi.unstubAllGlobals();
  });

  it("unwraps the production success/data/categories envelope and renders it in the async overlay", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(productionCategoryEnvelope));
    vi.stubGlobal("fetch", fetchMock);

    const onSearch = async (search, query) => ({
      categories: await getCategories({ search, signal: query.signal }),
      products: [],
      pagination: null,
    });

    render(
      <HeaderSearchOverlay
        open
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onSearch={onSearch}
        categories={[]}
      />,
    );

    await userEvent.setup().type(screen.getByRole("searchbox"), "PUBG");

    expect(await screen.findByRole("button", { name: /PUBG/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/categories?search=PUBG"),
      expect.objectContaining({ method: "GET" }),
    );
  });
});
