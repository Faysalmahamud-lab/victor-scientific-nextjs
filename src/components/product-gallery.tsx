"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductGallery({
  images,
  productName,
}: ProductGalleryProps) {
  const galleryImages = Array.from(
    new Set(images.filter(Boolean))
  );
  const safeImages = galleryImages.length
    ? galleryImages
    : ["/brand/logo.webp"];

  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];

  function showPrevious() {
    setActiveIndex((current) =>
      current === 0 ? safeImages.length - 1 : current - 1
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      current === safeImages.length - 1 ? 0 : current + 1
    );
  }

  useEffect(() => {
    if (!zoomOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomOpen(false);
      if (event.key === "ArrowLeft" && safeImages.length > 1) {
        setActiveIndex((current) =>
          current === 0 ? safeImages.length - 1 : current - 1
        );
      }
      if (event.key === "ArrowRight" && safeImages.length > 1) {
        setActiveIndex((current) =>
          current === safeImages.length - 1 ? 0 : current + 1
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [zoomOpen, safeImages.length]);

  return (
    <>
      <div className="product-gallery">
        <div
          className="product-gallery-thumbnails"
          aria-label="Product image thumbnails"
        >
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={`product-thumbnail ${
                activeIndex === index ? "is-active" : ""
              }`}
              aria-label={`Show product image ${index + 1}`}
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
            >
              <Image
                src={image}
                alt={`${productName} image ${index + 1}`}
                fill
                unoptimized
                sizes="84px"
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          className="product-main-image"
          onClick={() => setZoomOpen(true)}
          aria-label={`Zoom product image: ${productName}`}
        >
          <Image
            src={activeImage}
            alt={productName}
            fill
            unoptimized
            sizes="(max-width: 800px) 100vw, 48vw"
            priority
          />
          <span className="product-zoom-hint">
            <Maximize2 size={15} />
            Click to zoom
          </span>
        </button>
      </div>

      {zoomOpen && (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${productName} image viewer`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setZoomOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="product-lightbox-close"
            onClick={() => setZoomOpen(false)}
            aria-label="Close image viewer"
          >
            <X size={24} />
          </button>

          {safeImages.length > 1 && (
            <button
              type="button"
              className="product-lightbox-nav product-lightbox-prev"
              onClick={showPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <div className="product-lightbox-image">
            <Image
              src={activeImage}
              alt={`${productName} enlarged`}
              fill
              unoptimized
              sizes="100vw"
              priority
            />
          </div>

          {safeImages.length > 1 && (
            <button
              type="button"
              className="product-lightbox-nav product-lightbox-next"
              onClick={showNext}
              aria-label="Next image"
            >
              <ChevronRight size={28} />
            </button>
          )}

          <div className="product-lightbox-counter">
            {activeIndex + 1} / {safeImages.length}
          </div>
        </div>
      )}
    </>
  );
}
