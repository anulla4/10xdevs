import { test as setup } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// This setup test runs before dependent projects (per Playwright project dependencies).
// It ensures the E2E user exists and creates a persisted storageState for reusing auth.

setup("prepare auth state", async ({ page, context, baseURL }) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.E2E_EMAIL ?? "test@example.com";
  const password = process.env.E2E_PASSWORD ?? "password123";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  }

  // Ensure test user exists (idempotent create if missing)
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const list = await admin.auth.admin.listUsers();
  if (list.error) throw new Error(`Supabase listUsers error: ${list.error.message}`);
  const existing = list.data.users.find((u) => u.email === email);

  if (!existing) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw new Error(`Supabase createUser error: ${created.error.message}`);
  } else {
    // Ensure password matches env and email is confirmed
    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updated.error) throw new Error(`Supabase updateUser error: ${updated.error.message}`);
  }

  // Pre-auth through UI and save storageState
  if (!baseURL) throw new Error("baseURL is not defined in Playwright config");

  await page.goto(`/auth/login?redirectTo=${encodeURIComponent("/panel")}`, { waitUntil: "networkidle" });
  
  // Try data-test-id first, fall back to id if not found (for dev server caching issues)
  const emailInput = page.getByTestId("login-email").or(page.locator("#email"));
  const passwordInput = page.getByTestId("login-password").or(page.locator("#password"));
  const submitButton = page.getByTestId("login-submit").or(page.getByRole("button", { name: /zaloguj się/i }));
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  // Wait for either error or successful redirect
  const errorLocator = page.locator('[data-test-id="login-error"]');
  try {
    await page.waitForURL(/\/panel/, { timeout: 20_000 });
  } catch (e) {
    // Check if error message appeared
    const visible = await errorLocator.isVisible().catch(() => false);
    if (visible) {
      const msg = await errorLocator.textContent();
      throw new Error(`Login error during setup: ${msg}`);
    }
    // Otherwise, re-throw the timeout error
    throw e;
  }

  const authDir = path.resolve(process.cwd(), "tests/e2e/.auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  const storagePath = path.join(authDir, "storage.json");
  await context.storageState({ path: storagePath });

  // Seed test categories if they don't exist
  const { data: categories } = await admin.from("categories").select("id").limit(1);
  if (!categories || categories.length === 0) {
    const { error: insertError } = await admin.from("categories").insert([
      { name: "Test Category 1", icon: "🌿", color: "#10b981", sort_order: 1 },
      { name: "Test Category 2", icon: "🦋", color: "#3b82f6", sort_order: 2 },
    ]);
    if (insertError) {
      console.error("❌ Failed to seed categories:", insertError.message);
    } else {
      console.log("✅ Seeded test categories");
    }
  } else {
    console.log("ℹ️  Categories already exist, skipping seed");
  }
});
