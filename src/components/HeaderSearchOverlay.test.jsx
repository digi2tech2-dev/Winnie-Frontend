import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./FavoriteButton", () => ({ default: () => null }));

import HeaderSearchOverlay from "./HeaderSearchOverlay";

const product = (id, name) => ({
  id,
  name,
  categoryId: "category-1",
  categoryTitle: "Games",
  isActive: true,
  visibleInStore: true,
  isPurchasable: true,
});

describe("HeaderSearchOverlay global search", () => {
  afterEach(() => cleanup());
  it("starts empty and gives categories priority over products", async () => {
    const onSearch = vi.fn().mockResolvedValue({ products: [product("p1", "Game Card")], pagination: { page: 1, pages: 1, total: 1 } });
    render(
      <HeaderSearchOverlay
        open
        onClose={vi.fn()}
        onNavigate={vi.fn()}
        onSearch={onSearch}
        categories={[
          { id: "main", title: "Games", parentId: null, isActive: true },
          { id: "sub-1", title: "Game Cards", parentId: "main", isActive: true },
        ]}
      />,
    );

    expect(screen.getByText(/اكتب اسم القسم الفرعي|Type a subcategory/i)).toBeInTheDocument();
    const input = screen.getByRole("searchbox");
    await userEvent.setup().type(input, "game");
    expect(await screen.findByText("Game Cards")).toBeInTheDocument();
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("falls back to the server for products beyond the first 100 and loads another page", async () => {
    const onSearch = vi.fn()
      .mockResolvedValueOnce({ products: [product("p101", "Product 101")], pagination: { page: 1, pages: 2, total: 25, limit: 24 } })
      .mockResolvedValueOnce({ products: [product("p125", "Product 125")], pagination: { page: 2, pages: 2, total: 25, limit: 24 } });
    render(<HeaderSearchOverlay open onClose={vi.fn()} onNavigate={vi.fn()} onSearch={onSearch} categories={[]} />);
    const user = userEvent.setup();
    await user.type(screen.getByRole("searchbox"), "rare");
    expect(await screen.findByText("Product 101")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /تحميل المزيد|load more/i }));
    expect(await screen.findByText("Product 125")).toBeInTheDocument();
    expect(onSearch).toHaveBeenLastCalledWith("rare", expect.objectContaining({ page: 2 }));
  });

  it("ignores stale responses", async () => {
    let resolveFirst;
    let resolveSecond;
    const onSearch = vi.fn((term) => new Promise((resolve) => {
      if (term === "first") resolveFirst = resolve;
      else resolveSecond = resolve;
    }));
    render(<HeaderSearchOverlay open onClose={vi.fn()} onNavigate={vi.fn()} onSearch={onSearch} categories={[]} />);
    const user = userEvent.setup();
    const input = screen.getByRole("searchbox");
    await user.type(input, "first");
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("first", expect.anything()));
    await user.clear(input);
    await user.type(input, "second");
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("second", expect.anything()));
    resolveSecond({ products: [product("new", "New result")], pagination: { page: 1, pages: 1, total: 1 } });
    resolveFirst({ products: [product("old", "Old result")], pagination: { page: 1, pages: 1, total: 1 } });
    expect(await screen.findByText("New result")).toBeInTheDocument();
    expect(screen.queryByText("Old result")).not.toBeInTheDocument();
  });
});
