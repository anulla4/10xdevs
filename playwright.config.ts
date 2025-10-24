import { defineConfig, devices } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load .env.test for E2E (DB, auth, etc.)
(() => {
  try {
    const envTestPath = path.resolve(process.cwd(), ".env.test");
    if (fs.existsSync(envTestPath)) {
      const content = fs.readFileSync(envTestPath, "utf-8");
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) continue;
        const [, key, value] = match;
        // Strip surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          process.env[key] = value.slice(1, -1);
        } else {
          process.env[key] = value;
        }
      }
      // Ensure NODE_ENV=test for server & app during E2E
      process.env.NODE_ENV = process.env.NODE_ENV || "test";
    }
  } catch {
    // non-fatal: fallback to current env
  }
})();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL, SUPABASE_KEY, and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test for E2E tests.");
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Uruchamiamy testy sekwencyjnie (jeden po drugim), aby uniknąć problemów ze współdzielonym stanem (np. zalogowany użytkownik).
  // Docelowo można to rozwiązać przez izolację testów (każdy worker ma swojego użytkownika).
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    headless: false,
    launchOptions: {
      slowMo: 1000,
      devtools: true,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: false,
        // Zwolnij testy żeby było widać co się dzieje
        launchOptions: {
          slowMo: 100,
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4321",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "test",
      PORT: "4321",
      HOST: "127.0.0.1",
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    timeout: 60000, // Increased timeout to 60s
  },
});
