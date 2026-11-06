import { describe, expect, it } from "vitest";
import { formatPrice } from "../src/lib/site";

describe("Victor Scientific storefront helpers", () => {
  it("formats a price as Bangladeshi taka", () => {
    expect(formatPrice(1250)).toContain("৳");
    expect(formatPrice(1250)).toContain("1,250");
  });
});
