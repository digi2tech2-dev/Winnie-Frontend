import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FazerCardsSpecialProviderPage from "./FazerCardsSpecialProviderPage";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

// Keep the component and the real FazerCards API adapter mounted. Only the
// outbound HTTP transport is replaced with isolated synthetic responses.
vi.mock("../../../api/client", () => ({ apiRequest }));

const OFFER_ID = "64b000000000000000000111";
const PRODUCT_ID = "64b000000000000000000112";

function offer(overrides = {}) {
  return {
    _id: OFFER_ID,
    category: "Gift Cards",
    categoryName: "Gift Cards",
    currency: "USD",
    externalProductId: "FAZER_GIFT_10",
    familyKey: "GIFTCARDS",
    fulfillmentMode: "CODE_DELIVERY",
    imported: true,
    importedProduct: {
      _id: PRODUCT_ID,
      customerPurchaseEnabled: true,
      isActive: true,
      name: "Imported Fazer Gift",
      providerExecutionEnabled: false,
      providerExecutionMode: "MANUAL_FULFILLMENT",
      status: "available",
      visibleInStore: true,
      visibleToCustomer: true,
    },
    isActive: true,
    isSupported: true,
    maxQty: 1,
    minQty: 1,
    offerId: "gift-10",
    offerName: "Fazer Gift 10",
    rawName: "Fazer Gift 10",
    rawPrice: "10",
    supportLevel: "SUPPORTED",
    ...overrides,
  };
}

function createServer({ launchError = null } = {}) {
  const state = { offer: offer(), requests: [] };
  apiRequest.mockImplementation(async (endpoint, options = {}) => {
    state.requests.push({ endpoint, method: options.method || (options.body ? "POST" : "GET") });
    if (endpoint === "/admin/providers/fazercards/catalog/sync-status") return { data: {} };
    if (endpoint === "/admin/providers/fazercards/catalog/sync-jobs") return { data: { jobs: [] } };
    if (endpoint === "/admin/providers/fazercards/catalog/families") return { data: { families: [] } };
    if (endpoint === "/admin/providers/fazercards/provider-products") {
      const matches = options.query?.familyKey === "GIFTCARDS" || options.query?.category === "Gift Cards";
      return { data: matches ? [state.offer] : [], pagination: { page: 1, pages: 1, total: matches ? 1 : 0 } };
    }
    if (endpoint === `/admin/providers/fazercards/products/${PRODUCT_ID}/launch`) {
      if (launchError) throw launchError;
      state.offer = offer({
        importedProduct: {
          ...state.offer.importedProduct,
          providerExecutionEnabled: true,
          providerExecutionMode: "AUTO_PROVIDER",
        },
      });
      return {
        data: {
          launchStatus: { reasons: [], visibleToCustomer: true },
          product: state.offer.importedProduct,
          readiness: { configuration: { reasons: [] } },
        },
      };
    }
    throw new Error(`Unexpected request: ${options.method || "GET"} ${endpoint}`);
  });
  return state;
}

function renderSpecialPage() {
  return render(
    <MemoryRouter>
      <FazerCardsSpecialProviderPage
        health={{ api: { connectionOk: true } }}
        loadError=""
        loading={false}
        onRefresh={vi.fn()}
        supplier={{ active: true, name: "FazerCards", providerCode: "FAZER_CARDS" }}
        token="test-token"
      />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  apiRequest.mockReset();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("FazerCardsSpecialProviderPage mounted launch flow", () => {
  it("uses Launch Ops and refreshes the persisted automatic state after a real offer-selection flow", async () => {
    const state = createServer();
    const user = userEvent.setup();
    renderSpecialPage();

    const catalogSearch = screen.getByPlaceholderText("مثال: PUBG Mobile أو Netflix");
    await user.type(catalogSearch, "Gift");
    await user.click(catalogSearch.closest("form").querySelector('button[type="submit"]'));
    await user.click(await screen.findByRole("button", { name: /استرداد/ }));
    await user.click((await screen.findAllByRole("button", { name: /فتح الكتالوج/ }))[0]);
    await user.click(await screen.findByRole("button", { name: /Fazer Gift 10/ }));

    const autoLaunch = await screen.findByRole("button", { name: /تفعيل التنفيذ التلقائي/ });
    expect(autoLaunch).toBeEnabled();
    await user.click(autoLaunch);
    await user.click(await screen.findByRole("button", { name: "تأكيد التفعيل" }));

    await waitFor(() => expect(state.requests).toContainEqual({ endpoint: `/admin/providers/fazercards/products/${PRODUCT_ID}/launch`, method: "POST" }));
    expect(await screen.findByText(/تم ضبط النشر والتنفيذ التلقائي/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تفعيل التنفيذ التلقائي/ })).toBeDisabled();
  });
});
