import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// This teardown test runs after all dependent projects finish (per Playwright project dependencies).
// Cleans up test observations created during e2e tests.

teardown("cleanup after e2e", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.E2E_EMAIL ?? "test@example.com";

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("⚠️  Skipping teardown: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Get test user ID
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error("❌ Teardown: Error listing users:", listError.message);
      return;
    }

    const testUser = users.find((u) => u.email === email);
    if (!testUser) {
      console.log("ℹ️  Teardown: Test user not found, nothing to clean up");
      return;
    }

    // Delete all observations created by test user that match E2E pattern
    const { data: observations, error: fetchError } = await admin
      .from("observations")
      .select("id, name")
      .eq("user_id", testUser.id)
      .ilike("name", "E2E%");

    if (fetchError) {
      console.error("❌ Teardown: Error fetching observations:", fetchError.message);
      return;
    }

    if (observations && observations.length > 0) {
      const { error: deleteError } = await admin
        .from("observations")
        .delete()
        .eq("user_id", testUser.id)
        .ilike("name", "E2E%");

      if (deleteError) {
        console.error("❌ Teardown: Error deleting observations:", deleteError.message);
      } else {
        console.log(`✅ Teardown: Deleted ${observations.length} test observation(s)`);
      }
    } else {
      console.log("ℹ️  Teardown: No test observations to clean up");
    }
  } catch (error) {
    console.error("❌ Teardown: Unexpected error:", error);
  }
});
