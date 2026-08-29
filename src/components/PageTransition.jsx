import { useTheme } from "../context/ThemeContext";

/** Barba-style route entrance without a runtime transition library. */
export default function PageTransition({ children }) {
  const { theme } = useTheme();

  return (
    <>
      <div className={`barba-transition-curtain barba-transition-curtain--${theme}`} aria-hidden="true">
        <div className="barba-transition-brand">
          <img src="/logo.png" alt="" width="72" height="72" decoding="async" />
          <span><strong>Winnie</strong><b>HUB</b></span>
        </div>
      </div>
      <div className="winnie-page-stage page-transition-enter">{children}</div>
    </>
  );
}
