import { expect, test } from "@playwright/test";

test("pengguna tanpa sesi dialihkan ke login dan boleh melihat borang", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Refleksi kecil/i })).toBeVisible();
  await expect(page.getByLabel("E-mel")).toBeVisible();
  await expect(page.getByLabel("Kata laluan")).toBeVisible();
  await expect(page.getByRole("button", { name: "Daftar masuk" })).toBeVisible();
});
