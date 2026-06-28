import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    src: "/اسلايد1.jpg",
    alt: "اشتري الآن - عروض رقمية حصرية وآمنة",
  },
  {
    src: "/اسلايد2.jpg",
    alt: "Winnie Fun - شحن مميز وبطاقات واشتراكات رقمية",
  },
];

export default function HomeSlide({ categoriesPath = "/customer/categories" }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const navigate = useNavigate();

  const openCategories = () => {
    navigate(categoriesPath);
  };

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section dir="ltr" className="relative overflow-hidden rounded-lg border border-white/10 bg-[#080B20] shadow-[0_24px_70px_rgba(59,130,246,0.18)]">
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${activeSlide * 100}%)` }}
      >
        {slides.map((slide, index) =>
          index === 0 ? (
            <button
              key={slide.src}
              type="button"
              onClick={openCategories}
              className="block aspect-[2106/747] w-full shrink-0 cursor-pointer overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B20]"
              aria-label="فتح صفحة الأقسام"
              title="الأقسام"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
                loading="eager"
              />
            </button>
          ) : (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className="block aspect-[2106/747] w-full shrink-0 object-cover"
              loading="lazy"
            />
          ),
        )}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/22 px-2.5 py-1.5 backdrop-blur-md">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActiveSlide(index)}
            className={`h-2 rounded-full transition ${
              activeSlide === index ? "w-8 bg-white shadow-[0_0_16px_rgba(255,255,255,0.62)]" : "w-2 bg-white/45 hover:bg-white/70"
            }`}
            aria-label={`عرض السلايد ${index + 1}`}
            title={`السلايد ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
