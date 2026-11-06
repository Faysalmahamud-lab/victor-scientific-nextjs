"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { FloatingContact } from "@/components/floating-contact";
import { AnalyticsScripts, ConsentBanner } from "@/components/analytics";

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <main>{children}</main>;

  return (
    <div className="public-site-shell">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <AnalyticsScripts />
      <ConsentBanner />
      <MobileBottomNav />
      <FloatingContact />
    </div>
  );
}
