import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CustomerCategoryProducts from "./CustomerCategoryProducts";

const catalog = vi.hoisted(() => ({
  getCustomerCatalog: vi.fn(),
  t: (key, options) => options?.category || key,
}));

vi.mock("../../api/catalog", () => ({
  filterChildCategories: () => [],
  getCustomerCatalog: catalog.getCustomerCatalog,
}));
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ token: "customer-token" }),
}));
vi.mock("../../hooks/useCustomerPurchase", () => ({
  useCustomerPurchase: () => ({ openPurchase: vi.fn(), purchaseModals: null }),
}));
vi.mock("../../components/EmptyState", () => ({
  default: ({ title }) => <div>{title}</div>,
}));
vi.mock("../../components/home/HomeProductCard", () => ({
  default: ({ product }) => <article>{product.name}</article>,
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: catalog.t }),
}));

const categories = [
  { _id: "pubg-id", id: "pubg-id", name: "PUBG", slug: "pubg", title: "PUBG" },
  { _id: "mobile-id", id: "mobile-id", name: "Mobile Legends", slug: "mobile-legends", title: "Mobile Legends" },
];

function CatalogRoutes() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate("/customer/categories/mobile-legends")}>Switch category</button>
      <Routes>
        <Route path="/customer/categories/:categoryId" element={<CustomerCategoryProducts />} />
      </Routes>
    </>
  );
}

describe("CustomerCategoryProducts", () => {
  let failNextPageTwo;

  afterEach(() => cleanup());

  beforeEach(() => {
    failNextPageTwo = false;
    catalog.getCustomerCatalog.mockReset();
    catalog.getCustomerCatalog.mockImplementation(async (_token, query) => {
      if (query.category === "pubg" && query.search === "660") {
        return {
          categories,
          pagination: { page: 1, pages: 1, total: 1 },
          products: [{ id: "pubg-3", category: "pubg", name: "PUBG UC 660" }],
        };
      }
      if (query.category === "pubg" && query.search === "missing") {
        return {
          categories,
          pagination: { page: 1, pages: 0, total: 0 },
          products: [],
        };
      }
      if (query.category === "pubg" && query.page === 1) {
        return {
          categories,
          pagination: { page: 1, pages: 2, total: 3 },
          products: [{ id: "pubg-1", category: "pubg", name: "PUBG UC 60" }],
        };
      }
      if (query.category === "pubg" && query.page === 2) {
        if (failNextPageTwo) {
          failNextPageTwo = false;
          throw Object.assign(new Error("Page unavailable"), { userMessage: "Page unavailable" });
        }
        return {
          categories,
          pagination: { page: 2, pages: 2, total: 3 },
          products: [
            { id: "pubg-2", category: "pubg", name: "PUBG UC 325" },
            { id: "pubg-3", category: "pubg", name: "PUBG UC 660" },
          ],
        };
      }
      if (query.category === "mobile-legends") {
        return {
          categories,
          pagination: { page: 1, pages: 1, total: 1 },
          products: [{ id: "mobile-1", category: "mobile-legends", name: "Mobile Legends Diamonds" }],
        };
      }
      throw new Error(`Unexpected category request: ${query.category}`);
    });
  });

  it("loads the selected category, appends later pages, and reloads on category navigation", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/customer/categories/pubg"]}>
        <CatalogRoutes />
      </MemoryRouter>,
    );

    await screen.findByText("PUBG UC 60");
    expect(catalog.getCustomerCatalog).toHaveBeenCalledWith("customer-token", {
      category: "pubg",
      limit: 24,
      page: 1,
    });

    await user.click(screen.getByRole("button", { name: "common:actions.loadMore" }));
    await screen.findByText("PUBG UC 660");
    expect(catalog.getCustomerCatalog).toHaveBeenCalledWith("customer-token", {
      category: "pubg",
      limit: 24,
      page: 2,
    });

    await user.click(screen.getByRole("button", { name: "Switch category" }));
    await screen.findByText("Mobile Legends Diamonds");
    await waitFor(() => expect(catalog.getCustomerCatalog).toHaveBeenCalledWith("customer-token", {
      category: "mobile-legends",
      limit: 24,
      page: 1,
    }));
    expect(screen.queryByText("PUBG UC 60")).not.toBeInTheDocument();
  });

  it("debounces search and searches the full category on the backend", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/customer/categories/pubg"]}>
        <CatalogRoutes />
      </MemoryRouter>,
    );

    await screen.findByText("PUBG UC 60");
    const search = screen.getByRole("textbox");
    await user.type(search, "660");
    await screen.findByText("PUBG UC 660");

    expect(catalog.getCustomerCatalog).toHaveBeenCalledWith("customer-token", {
      category: "pubg",
      search: "660",
      limit: 24,
      page: 1,
    });
    expect(screen.queryByText("PUBG UC 60")).not.toBeInTheDocument();
  });

  it("shows an empty state only after a debounced search returns zero category matches", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/customer/categories/pubg"]}>
        <CatalogRoutes />
      </MemoryRouter>,
    );

    await screen.findByText("PUBG UC 60");
    await user.type(screen.getByRole("textbox"), "missing");
    await screen.findByText("category.noProductsFound");
    expect(screen.queryByRole("button", { name: "common:actions.loadMore" })).not.toBeInTheDocument();
  });

  it("retains loaded products and retries the same failed page without duplication", async () => {
    const user = userEvent.setup();
    failNextPageTwo = true;
    render(
      <MemoryRouter initialEntries={["/customer/categories/pubg"]}>
        <CatalogRoutes />
      </MemoryRouter>,
    );

    await screen.findByText("PUBG UC 60");
    await user.click(screen.getByRole("button", { name: "common:actions.loadMore" }));
    await screen.findByRole("alert");
    expect(screen.getByText("PUBG UC 60")).toBeInTheDocument();
    expect(screen.queryByText("PUBG UC 660")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "common:actions.retry" }));
    await screen.findByText("PUBG UC 660");
    expect(screen.getAllByText(/PUBG UC/)).toHaveLength(3);
    expect(catalog.getCustomerCatalog).toHaveBeenCalledWith("customer-token", {
      category: "pubg",
      limit: 24,
      page: 2,
    });
  });

  it("ignores a stale search response after switching categories", async () => {
    let resolveStaleSearch;
    catalog.getCustomerCatalog.mockImplementation(async (_token, query) => {
      if (query.category === "mobile-legends") {
        return {
          categories,
          pagination: { page: 1, pages: 1, total: 1 },
          products: [{ id: "mobile-1", category: "mobile-legends", name: "Mobile Legends Diamonds" }],
        };
      }
      if (query.search === "stale") {
        return new Promise((resolve) => { resolveStaleSearch = resolve; });
      }
      return {
        categories,
        pagination: { page: 1, pages: 1, total: 1 },
        products: [{ id: "pubg-1", category: "pubg", name: "PUBG UC 60" }],
      };
    });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/customer/categories/pubg"]}>
        <CatalogRoutes />
      </MemoryRouter>,
    );

    await screen.findByText("PUBG UC 60");
    await user.type(screen.getByRole("textbox"), "stale");
    await waitFor(() => expect(resolveStaleSearch).toEqual(expect.any(Function)));
    await user.click(screen.getByRole("button", { name: "Switch category" }));
    await screen.findByText("Mobile Legends Diamonds");

    resolveStaleSearch({
      categories,
      pagination: { page: 1, pages: 1, total: 1 },
      products: [{ id: "stale", category: "pubg", name: "Stale PUBG result" }],
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByText("Stale PUBG result")).not.toBeInTheDocument();
    expect(screen.getByText("Mobile Legends Diamonds")).toBeInTheDocument();
  });

  it("keeps the authenticated admin category route compatible", async () => {
    render(
      <MemoryRouter initialEntries={["/admin/user/categories/pubg"]}>
        <Routes>
          <Route path="/admin/user/categories/:categoryId" element={<CustomerCategoryProducts basePath="/admin/user" />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("PUBG UC 60");
    expect(catalog.getCustomerCatalog).toHaveBeenCalledWith("customer-token", {
      category: "pubg",
      limit: 24,
      page: 1,
    });
  });
});
