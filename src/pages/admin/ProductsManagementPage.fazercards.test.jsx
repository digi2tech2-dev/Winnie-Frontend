import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../api/errors";
import { ToastProvider } from "../../components/ToastProvider";
import { AUTH_TOKEN_KEY, AUTH_USER_CACHE_KEY, AuthProvider } from "../../context/AuthContext";
import ProductsManagementPage from "./ProductsManagementPage";

const { apiRequest } = vi.hoisted(() => ({ apiRequest: vi.fn() }));

// The API client is the only mocked boundary. The real page, modal, API
// adapters, router, AuthProvider, and ToastProvider run in these tests.
vi.mock("../../api/client", () => ({ apiRequest }));

const CATEGORY_ID = "64b000000000000000000001";
const PRODUCT_ID = "64b000000000000000000002";
const FAZER_PROVIDER_ID = "64b000000000000000000003";
const XENA_PROVIDER_ID = "64b000000000000000000004";
const FAZER_PROVIDER_PRODUCT_ID = "64b000000000000000000005";
const XENA_PROVIDER_PRODUCT_ID = "64b000000000000000000006";

function rawProduct(overrides = {}) {
  const fazer = overrides.providerCode !== "XENA";
  return {
    _id: PRODUCT_ID,
    basePrice: "10",
    category: { _id: CATEGORY_ID, name: "Games", nameAr: "الألعاب" },
    customerPurchaseEnabled: true,
    description: "Original description",
    finalPrice: "12",
    isActive: true,
    isPaused: false,
    name: "بطاقة اختبار",
    nameEn: "Test card",
    provider: fazer
      ? { _id: FAZER_PROVIDER_ID, name: "FazerCards", providerCode: "FAZER_CARDS" }
      : { _id: XENA_PROVIDER_ID, name: "Xena", providerCode: "XENA" },
    providerCode: fazer ? "FAZER_CARDS" : "XENA",
    providerExecutionBlocked: false,
    providerExecutionEnabled: false,
    providerExecutionMode: "MANUAL_FULFILLMENT",
    providerProduct: {
      _id: fazer ? FAZER_PROVIDER_PRODUCT_ID : XENA_PROVIDER_PRODUCT_ID,
      externalProductId: fazer ? "FAZER_GIFT_10" : "XENA_10",
      familyKey: fazer ? "GIFTCARDS" : "TOPUPS",
      fulfillmentMode: fazer ? "CODE_DELIVERY" : "TOPUP_WITH_FIELDS",
      isActive: true,
      isSupported: true,
      maxQty: 5,
      minQty: 1,
      name: fazer ? "Fazer Gift 10" : "Xena Topup",
      price: "10",
      supportLevel: "SUPPORTED",
    },
    status: "available",
    visibleInStore: true,
    ...overrides,
  };
}

function createServer({ product = rawProduct(), launch = null } = {}) {
  const state = {
    launch: launch || (async ({ body }) => {
      state.product = {
        ...state.product,
        customerPurchaseEnabled: body.customerPurchaseEnabled,
        isActive: body.isActive,
        providerExecutionBlocked: body.providerExecutionBlocked,
        providerExecutionEnabled: body.providerExecutionEnabled,
        providerExecutionMode: body.providerExecutionMode,
        status: body.status,
        visibleInStore: body.visibleInStore,
      };
      return {
        data: {
          launchStatus: { reasons: [], visibleToCustomer: true },
          product: state.product,
        },
        message: "Launch updated",
      };
    }),
    product,
    requests: [],
  };

  apiRequest.mockImplementation(async (endpoint, options = {}) => {
    state.requests.push({ body: options.body, endpoint, method: options.method || (options.body ? "POST" : "GET") });

    if (endpoint === "/me") {
      return { data: { _id: "64b000000000000000000099", email: "admin@example.test", role: "ADMIN", status: "ACTIVE" } };
    }
    if (endpoint === "/admin/categories") {
      return { data: { categories: [{ _id: CATEGORY_ID, isActive: true, name: "Games", nameAr: "الألعاب" }] } };
    }
    if (endpoint === "/admin/products") {
      return { data: [state.product], pagination: { limit: 15, page: 1, total: 1 } };
    }
    if (endpoint === `/products/${PRODUCT_ID}`) {
      return { data: { product: state.product } };
    }
    if (endpoint === "/admin/product-provider-options") {
      return {
        data: {
          providers: [
            { _id: FAZER_PROVIDER_ID, isActive: true, name: "FazerCards", providerCode: "FAZER_CARDS" },
            { _id: XENA_PROVIDER_ID, isActive: true, name: "Xena", providerCode: "XENA" },
          ],
        },
      };
    }
    if (endpoint === `/admin/product-provider-options/${XENA_PROVIDER_ID}/products`) {
      return { data: [{ _id: XENA_PROVIDER_PRODUCT_ID, maxQty: 5, minQty: 1, name: "Xena Topup", price: "10" }], pagination: { page: 1, total: 1 } };
    }
    if (endpoint === `/admin/products/${PRODUCT_ID}` && options.method === "PATCH") {
      state.product = {
        ...state.product,
        basePrice: options.body.basePrice ?? state.product.basePrice,
        description: options.body.description ?? state.product.description,
        finalPrice: options.body.finalPrice ?? state.product.finalPrice,
        name: options.body.name ?? state.product.name,
        nameEn: options.body.nameEn ?? state.product.nameEn,
      };
      return { data: { product: state.product }, message: "Saved" };
    }
    if (endpoint === `/admin/providers/fazercards/products/${PRODUCT_ID}/launch`) {
      return state.launch({ body: options.body, state });
    }
    if (endpoint === `/admin/products/${PRODUCT_ID}/provider-link`) {
      state.product = { ...state.product, providerLinkUpdated: true };
      return { data: { product: state.product }, message: "Provider linked" };
    }

    throw new Error(`Unexpected mocked API request: ${options.method || "GET"} ${endpoint}`);
  });

  return state;
}

function renderPage() {
  localStorage.setItem(AUTH_TOKEN_KEY, "test-token");
  localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify({ _id: "64b000000000000000000099", role: "ADMIN", status: "ACTIVE" }));
  return render(
    <MemoryRouter initialEntries={["/admin/tools/products"]}>
      <AuthProvider>
        <ToastProvider>
          <ProductsManagementPage />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function openProduct(user) {
  await screen.findAllByRole("button", { name: "تعديل بطاقة اختبار" });
  const [editButton] = screen.getAllByRole("button", { name: "تعديل بطاقة اختبار" });
  await user.click(editButton);
  return screen.findByRole("dialog", { name: "تعديل المنتج" });
}

async function saveProduct(user) {
  await user.click(screen.getByRole("button", { name: "حفظ المنتج" }));
}

function requestPaths(state) {
  return state.requests.map((request) => `${request.method} ${request.endpoint}`);
}

beforeEach(() => {
  apiRequest.mockReset();
  localStorage.clear();
  window.confirm = vi.fn(() => true);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProductsManagementPage FazerCards mounted workflow", () => {
  it("edits ordinary FazerCards metadata without relinking or changing execution", async () => {
    const state = createServer();
    const user = userEvent.setup();
    renderPage();
    await openProduct(user);

    const nameInput = screen.getByDisplayValue("بطاقة اختبار");
    await user.clear(nameInput);
    await user.type(nameInput, "بطاقة محدثة");
    await saveProduct(user);

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "تعديل المنتج" })).not.toBeInTheDocument());
    expect(state.product.name).toBe("بطاقة محدثة");
    expect(requestPaths(state)).toContain(`PATCH /admin/products/${PRODUCT_ID}`);
    expect(requestPaths(state)).not.toContain(`PATCH /admin/products/${PRODUCT_ID}/provider-link`);
    expect(requestPaths(state)).not.toContain(`POST /admin/providers/fazercards/products/${PRODUCT_ID}/launch`);
    const ordinaryPatch = state.requests.find((request) => request.endpoint === `/admin/products/${PRODUCT_ID}` && request.method === "PATCH");
    expect(ordinaryPatch.body).not.toHaveProperty("providerExecutionEnabled");
    expect(ordinaryPatch.body).not.toHaveProperty("providerExecutionMode");
  });

  it("routes FazerCards auto-enable through Launch Ops then reads the authoritative persisted product", async () => {
    const state = createServer();
    const user = userEvent.setup();
    renderPage();
    await openProduct(user);

    await user.click(screen.getByRole("button", { name: /التسعير/ }));
    const toggle = await screen.findByRole("checkbox", { name: "تفعيل التنفيذ التلقائي من FazerCards" });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    await saveProduct(user);

    await waitFor(() => expect(requestPaths(state)).toContain(`POST /admin/providers/fazercards/products/${PRODUCT_ID}/launch`));
    expect(requestPaths(state)).not.toContain(`PATCH /admin/products/${PRODUCT_ID}/provider-link`);
    expect(state.product.providerExecutionEnabled).toBe(true);
    expect(state.product.providerExecutionMode).toBe("MANUAL_FULFILLMENT");

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "تعديل المنتج" })).not.toBeInTheDocument());
    await openProduct(user);
    await user.click(screen.getByRole("button", { name: /التسعير/ }));
    expect(await screen.findByRole("checkbox", { name: "تفعيل التنفيذ التلقائي من FazerCards" })).toBeChecked();
  });

  it.each([
    [403, "UNAUTHORIZED", "ليس لديك صلاحية تنفيذ هذه العملية."],
    [409, "FAZERCARDS_LAUNCH_CONFLICT", "تعارض"],
  ])("keeps the persisted disabled execution state after a Launch Ops %s response", async (status, code, expectedMessage) => {
    const state = createServer({
      launch: async () => {
        throw new ApiError("Rejected", { code, status, userMessage: status === 409 ? "تعارض: تم تحديث المنتج بواسطة مسؤول آخر." : "Rejected" });
      },
    });
    const user = userEvent.setup();
    renderPage();
    await openProduct(user);
    await user.click(screen.getByRole("button", { name: /التسعير/ }));
    await user.click(await screen.findByRole("checkbox", { name: "تفعيل التنفيذ التلقائي من FazerCards" }));
    await saveProduct(user);

    await screen.findByText(/حُفظت بيانات المنتج لكن لم يتغير التنفيذ التلقائي/);
    expect(screen.getByText(new RegExp(expectedMessage))).toBeInTheDocument();
    expect(requestPaths(state).filter((path) => path === `POST /admin/providers/fazercards/products/${PRODUCT_ID}/launch`)).toHaveLength(1);
    await openProduct(user);
    await user.click(screen.getByRole("button", { name: /التسعير/ }));
    expect(await screen.findByRole("checkbox", { name: "تفعيل التنفيذ التلقائي من FazerCards" })).not.toBeChecked();
  });

  it("does not let a stale launch response overwrite a newer authoritative server state", async () => {
    let resolveLaunch;
    const launchDeferred = new Promise((resolve) => { resolveLaunch = resolve; });
    const state = createServer({ launch: async () => launchDeferred });
    const user = userEvent.setup();
    renderPage();
    await openProduct(user);
    await user.click(screen.getByRole("button", { name: /التسعير/ }));
    await user.click(await screen.findByRole("checkbox", { name: "تفعيل التنفيذ التلقائي من FazerCards" }));
    await saveProduct(user);
    await waitFor(() => expect(requestPaths(state)).toContain(`POST /admin/providers/fazercards/products/${PRODUCT_ID}/launch`));

    state.product = {
      ...state.product,
      providerExecutionBlocked: true,
      providerExecutionEnabled: false,
      providerBlockReason: "SOURCE_UNAVAILABLE",
    };
    resolveLaunch({
      data: { launchStatus: { reasons: [], visibleToCustomer: true }, product: { ...state.product, providerExecutionEnabled: true } },
      message: "stale launch response",
    });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "تعديل المنتج" })).not.toBeInTheDocument());
    await openProduct(user);
    await user.click(screen.getByRole("button", { name: /التسعير/ }));
    const toggle = await screen.findByRole("checkbox", { name: "تفعيل التنفيذ التلقائي من FazerCards" });
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
    expect(screen.getAllByText(/SOURCE_UNAVAILABLE/).length).toBeGreaterThan(0);
  });

  it("preserves the generic provider-link workflow for a non-FazerCards product", async () => {
    const genericProduct = rawProduct({ providerCode: "XENA" });
    genericProduct.providerProduct.fulfillmentMode = "CODE_DELIVERY";
    const state = createServer({ product: genericProduct });
    const user = userEvent.setup();
    renderPage();
    await openProduct(user);
    await waitFor(() => expect(requestPaths(state)).toContain(`GET /admin/product-provider-options/${XENA_PROVIDER_ID}/products`));
    const nameInput = screen.getByDisplayValue("بطاقة اختبار");
    await user.clear(nameInput);
    await user.type(nameInput, "منتج Xena محدث");
    await saveProduct(user);

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "تعديل المنتج" })).not.toBeInTheDocument());
    await waitFor(() => expect(requestPaths(state)).toContain(`PATCH /admin/products/${PRODUCT_ID}/provider-link`));
    expect(requestPaths(state)).not.toContain(`POST /admin/providers/fazercards/products/${PRODUCT_ID}/launch`);
  });
});
