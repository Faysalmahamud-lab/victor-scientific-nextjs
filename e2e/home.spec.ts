import { test, expect } from "@playwright/test";
test("home page loads and exposes primary navigation", async ({page})=>{await page.goto("/");await expect(page.getByRole("heading",{name:/better tools for better science/i})).toBeVisible();await expect(page.getByRole("link",{name:/explore equipment/i}).first()).toBeVisible();});
