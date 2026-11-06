"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Slide = {
  id: number;
  image: string;
  link: string;
};

export function HomeSlider({
  slides,
}: {
  slides: Slide[];
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((current) =>
        (current + 1) % slides.length
      );
    }, 5500);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[active];

  return (
    <div
      className="home-slider"
      aria-roledescription="carousel"
      aria-label="Victor Scientific promotional banners"
    >
      <a
        href={slide.link || "/shop"}
        className="home-slider-link"
        aria-label={`Open promotional banner ${active + 1}`}
      >
        <Image
          src={slide.image}
          alt={`Victor Scientific promotional banner ${active + 1}`}
          fill
          priority={active === 0}
          unoptimized
          sizes="(max-width: 768px) 100vw, 1180px"
          className="home-slider-image"
        />
      </a>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="home-slider-control home-slider-prev"
            onClick={() =>
              setActive(
                (active - 1 + slides.length) % slides.length
              )
            }
            aria-label="Previous banner"
          >
            <ChevronLeft size={23} />
          </button>

          <button
            type="button"
            className="home-slider-control home-slider-next"
            onClick={() =>
              setActive((active + 1) % slides.length)
            }
            aria-label="Next banner"
          >
            <ChevronRight size={23} />
          </button>

          <div className="home-slider-dots">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={
                  index === active
                    ? "home-slider-dot active"
                    : "home-slider-dot"
                }
                onClick={() => setActive(index)}
                aria-label={`Go to banner ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
