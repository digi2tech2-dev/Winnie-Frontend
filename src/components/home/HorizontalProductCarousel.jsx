import { Children, useEffect, useRef } from "react";

export default function HorizontalProductCarousel({ children, label }) {
  const carouselRef = useRef(null);
  const itemCount = Children.count(children);

  useEffect(() => {
    if (carouselRef.current) carouselRef.current.scrollLeft = 0;
  }, [itemCount]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return undefined;

    const releaseVerticalWheel = (event) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      event.preventDefault();
      const multiplier = event.deltaMode === 1
        ? 16
        : event.deltaMode === 2
          ? window.innerHeight
          : 1;
      window.scrollBy({ top: event.deltaY * multiplier, behavior: "auto" });
    };

    carousel.addEventListener("wheel", releaseVerticalWheel, { passive: false });
    return () => carousel.removeEventListener("wheel", releaseVerticalWheel);
  }, []);

  return (
    <div className="relative" dir="rtl">
      <div
        ref={carouselRef}
        aria-label={label}
        dir="rtl"
        className="homepage-product-carousel flex snap-x snap-proximity gap-3 overflow-x-auto px-1 pb-2 pt-1 sm:gap-4"
      >
        {children}
      </div>
    </div>
  );
}
