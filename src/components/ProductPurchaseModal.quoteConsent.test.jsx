import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ createCustomerOrderQuote: vi.fn() }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { walletBalance: 100, currency: "USD" } }),
}));
vi.mock("../api/orders", async (importOriginal) => ({
  ...(await importOriginal()),
  createCustomerOrderQuote: api.createCustomerOrderQuote,
}));

import ProductPurchaseModal from "./ProductPurchaseModal";

const product = {
  _id: "507f1f77bcf86cd799439011",
  name: "Quote service",
  basePrice: "10",
  finalPrice: "10",
  minQty: 1,
  maxQty: 1,
  isActive: true,
  visibleInStore: true,
  customerPurchaseEnabled: true,
};

const quote = (quoteId, displayTotal) => ({
  quoteId,
  quantity: 1,
  currency: "USD",
  chargedAmount: Number(displayTotal.slice(-2)),
  payableAmount: Number(displayTotal.slice(-2)),
  displayTotal,
  isQuantityValid: true,
  hasEnoughBalance: true,
});

describe("ProductPurchaseModal quote consent", () => {
  beforeEach(() => api.createCustomerOrderQuote.mockReset());

  it("renders a refreshed quote after a stale-price response and submits only its server reference", async () => {
    api.createCustomerOrderQuote
      .mockResolvedValueOnce(quote("507f1f77bcf86cd799439012", "USD 10.00"))
      .mockResolvedValueOnce(quote("507f1f77bcf86cd799439013", "USD 12.00"));
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ProductPurchaseModal product={product} token="test" onClose={vi.fn()} onConfirm={onConfirm} requireAccountId={false} />,
    );

    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox"), "1");
    await screen.findByText("USD 10.00");
    rerender(
      <ProductPurchaseModal product={product} token="test" onClose={vi.fn()} onConfirm={onConfirm} requireAccountId={false} quoteRefreshNonce={1} submitError="The price has changed. Please review and confirm the updated price." />,
    );
    await screen.findByText("USD 12.00");
    expect(screen.getByText(/price has changed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /تأكيد/ }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      quote: expect.objectContaining({ quoteId: "507f1f77bcf86cd799439013" }),
    })));
  });
});
