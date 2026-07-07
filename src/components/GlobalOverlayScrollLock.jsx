import { useEffect } from "react";

const overlaySelector = [
  '[aria-modal="true"]',
  '[role="alertdialog"]',
  ".fixed.inset-0",
].join(",");

function isVisible(element) {
  if (!(element instanceof HTMLElement) || element.getAttribute("aria-hidden") === "true") return false;

  let current = element;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.pointerEvents === "none" ||
      Number.parseFloat(style.opacity || "1") <= 0.01
    ) {
      return false;
    }
    current = current.parentElement;
  }

  const bounds = element.getBoundingClientRect();
  return bounds.width > 0 && bounds.height > 0;
}

export default function GlobalOverlayScrollLock() {
  useEffect(() => {
    let frameId = 0;
    let lastScrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);

    const updateScrollLock = () => {
      frameId = 0;
      const overlayOpen = Array.from(document.querySelectorAll(overlaySelector)).some(isVisible);
      if (!overlayOpen) {
        lastScrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      }
      document.documentElement.style.setProperty("--site-scrollbar-compensation", `${lastScrollbarWidth}px`);
      document.documentElement.classList.toggle("site-overlay-open", overlayOpen);
      document.body.classList.toggle("site-overlay-open", overlayOpen);
    };

    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateScrollLock);
    };

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-hidden", "aria-modal", "class", "role"],
    });

    updateScrollLock();

    return () => {
      observer.disconnect();
      if (frameId) window.cancelAnimationFrame(frameId);
      document.documentElement.classList.remove("site-overlay-open");
      document.body.classList.remove("site-overlay-open");
      document.documentElement.style.removeProperty("--site-scrollbar-compensation");
    };
  }, []);

  return null;
}
