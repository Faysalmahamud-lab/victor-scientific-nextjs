import type { Metadata, Viewport } from "next";
import { SiteChrome } from "@/components/site-chrome";
import { siteDescription, siteName, siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDescription,
  applicationName: siteName,
  openGraph: { type: "website", siteName, title: siteName, description: siteDescription, url: siteUrl, images: [{ url: "/brand/logo.webp", width: 600, height: 190, alt: siteName }] },
  twitter: { card: "summary_large_image", title: siteName, description: siteDescription },
  icons: { icon: "/favicon.ico", apple: "/icon-192.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0a1b2d" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-BD"><body><SiteChrome>{children}</SiteChrome></body></html>;
}
