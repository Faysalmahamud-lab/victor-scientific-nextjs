"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Grid2X2,
  MapPin,
  Search,
  Store,
  UserRound,
  X,
  ArrowUpRight,
} from "lucide-react";

type NavigationItem = {
  id: number;
  name: string;
  slug: string;
};

type NavigationResponse = {
  categories?: NavigationItem[];
  brands?: NavigationItem[];
};

const storeAddress =
  process.env.NEXT_PUBLIC_STORE_ADDRESS ||
  "10 Hatkhola Road, Kader Tropical Heights (2nd floor), Tikatuli, Dhaka 1203";
const storePhone = process.env.NEXT_PUBLIC_STORE_PHONE || "01844-572826";
const storeMapUrl =
  process.env.NEXT_PUBLIC_STORE_MAP_URL ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    "Victor Scientific Co., Kader Tropical Heights, 10 Hatkhola Rd, Dhaka 1203"
  )}`;

export function SiteHeader() {
  const [compact, setCompact] = useState(false);
  const [categories, setCategories] = useState<NavigationItem[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const nextCompact = window.scrollY > 32;
      setCompact((current) =>
        current === nextCompact ? current : nextCompact
      );
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/navigation", {
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Navigation request failed");
        return response.json() as Promise<NavigationResponse>;
      })
      .then((data) => {
        if (active) setCategories(data.categories ?? []);
      })
      .catch(() => {
        if (active) setCategories([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!categoriesOpen && !searchOpen && !locationOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCategoriesOpen(false);
        setSearchOpen(false);
        setLocationOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [categoriesOpen, searchOpen, locationOpen]);

  return (
    <header className={`site-header ${compact ? "is-compact" : ""}`}>
      <div className="container header-inner">
        <div className="header-category-wrap">
          <button
            type="button"
            className="header-category-button"
            aria-expanded={categoriesOpen}
            aria-controls="header-category-menu"
            onClick={() => {
              setCategoriesOpen((open) => !open);
              setSearchOpen(false);
              setLocationOpen(false);
            }}
          >
            <Grid2X2 size={18} />
            <span>Categories</span>
            <ChevronDown size={15} className={categoriesOpen ? "is-rotated" : ""} />
          </button>

          {categoriesOpen && (
            <div className="header-category-menu" id="header-category-menu">
              <div className="header-menu-heading">
                <strong>Shop by category</strong>
                <Link href="/shop" onClick={() => setCategoriesOpen(false)}>
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="header-category-list">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                    >
                      {category.name}
                      <ArrowUpRight size={13} />
                    </Link>
                  ))
                ) : (
                  <Link href="/shop" onClick={() => setCategoriesOpen(false)}>
                    Browse all products
                    <ArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <Link href="/" className="brand-lockup" aria-label="Victor Scientific home">
          <Image
            src="/brand/logo.webp"
            alt="Victor Scientific Co."
            width={184}
            height={58}
            priority
          />
        </Link>

        <div className="header-actions">
          <form action="/search" method="get" className="header-search-desktop">
            <Search size={17} />
            <input
              type="search"
              name="q"
              placeholder="Search products..."
              aria-label="Search products"
              maxLength={100}
            />
            <button type="submit" aria-label="Submit product search">
              <ArrowUpRight size={15} />
            </button>
          </form>

          <button
            type="button"
            className="header-icon-button header-search-mobile"
            aria-label="Open search"
            aria-expanded={searchOpen}
            onClick={() => {
              setSearchOpen((open) => !open);
              setCategoriesOpen(false);
              setLocationOpen(false);
            }}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <button
            type="button"
            className="header-location-button"
            aria-expanded={locationOpen}
            onClick={() => {
              setLocationOpen(true);
              setCategoriesOpen(false);
              setSearchOpen(false);
            }}
          >
            <MapPin size={18} />
            <span>Store Location</span>
          </button>

          <Link href="/account/login" className="header-account-button">
            <UserRound size={18} />
            <span>Login / Account</span>
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="header-search-popover">
          <form action="/search" method="get" className="header-search-popover-form">
            <Search size={18} />
            <input
              type="search"
              name="q"
              autoFocus
              placeholder="Search products, model or product code..."
              aria-label="Search products"
              maxLength={100}
            />
            <button type="submit">Search</button>
          </form>
        </div>
      )}

      {locationOpen && (
        <div
          className="store-location-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setLocationOpen(false);
            }
          }}
        >
          <section
            className="store-location-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-location-title"
          >
            <button
              type="button"
              className="store-location-close"
              aria-label="Close store location"
              onClick={() => setLocationOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="store-location-icon">
              <Store size={22} />
            </div>
            <span className="home-kicker">VISIT OUR STORE</span>
            <h2 id="store-location-title">Store Location</h2>
            <p className="store-location-name">Victor Scientific Co.</p>
            <p className="store-location-address">{storeAddress}</p>

            {storePhone && (
              <a className="store-location-phone" href={`tel:${storePhone}`}>
                {storePhone}
              </a>
            )}

            <a
              className="store-location-map-link"
              href={storeMapUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={17} />
              Open in Google Maps
              <ArrowUpRight size={15} />
            </a>
          </section>
        </div>
      )}
    </header>
  );
}
