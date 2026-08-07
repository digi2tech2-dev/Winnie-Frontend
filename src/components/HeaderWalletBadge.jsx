import { Wallet } from "lucide-react";
import { Link } from "react-router-dom";

function formatWholeBalance(value) {
  const amount = Number(value);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export default function HeaderWalletBadge({
  balance = 0,
  className = "",
  currency = "USD",
  to,
}) {
  const wholeBalance = formatWholeBalance(balance);
  const normalizedCurrency = String(currency || "USD").toUpperCase();

  return (
    <Link
      to={to}
      className={"header-wallet-badge admin-header-wallet group relative min-w-0 transition hover:-translate-y-0.5 " + className}
      aria-label={"المحفظة، الرصيد " + wholeBalance + " " + normalizedCurrency}
      title={"رصيد المحفظة: " + wholeBalance + " " + normalizedCurrency}
    >
      <span className="header-wallet-badge-icon admin-header-wallet-icon grid shrink-0 place-items-center" aria-hidden="true">
        <Wallet className="h-4 w-4" />
      </span>
      <span dir="ltr" className="header-wallet-badge-balance admin-header-wallet-balance min-w-0">
        <strong>{wholeBalance}</strong>
        <small>{normalizedCurrency}</small>
      </span>
    </Link>
  );
}
