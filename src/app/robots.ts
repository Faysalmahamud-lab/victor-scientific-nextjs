import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/shop",
          "/product/",
          "/category/",
          "/brands",
          "/page/",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/cart",
          "/checkout",
          "/account/",
          "/track-order",
          "/order-confirmation",
          "/search",
          "/campaign/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
