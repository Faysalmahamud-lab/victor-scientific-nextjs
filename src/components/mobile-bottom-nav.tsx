"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  LayoutGrid,
  PackageSearch,
  ShoppingBag,
  UserRound,
} from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Categories", icon: LayoutGrid },
  { href: "/track-order", label: "Track Order", icon: PackageSearch },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/account/login", label: "Login", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const previousScroll = useRef(0);

  useEffect(() => {
    previousScroll.current = window.scrollY;

    function handleScroll() {
      const current = window.scrollY;
      const difference = current - previousScroll.current;

      if (current < 72) {
        setVisible(true);
      } else if (difference > 7) {
        setVisible(false);
      } else if (difference < -7) {
        setVisible(true);
      }

      previousScroll.current = current;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`mobile-bottom-nav ${visible ? "is-visible" : "is-hidden"}`}
      aria-label="Mobile quick navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={active ? "is-active" : ""}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
