export const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Victor Scientific Co.";
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.victorscientificbd.com").replace(/\/$/, "");
export const siteDescription = "Company information and general support for Victor Scientific Co.";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function formatPrice(value: number | null | undefined) {
  if (!value || value <= 0) return "Contact for price";
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);
}
