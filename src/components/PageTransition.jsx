/** Lightweight route reveal. The previous full-screen curtain delayed every
 * navigation and was especially noticeable on mobile connections. */
export default function PageTransition({ children }) {
  return <div className="winnie-page-stage page-transition-enter">{children}</div>;
}
