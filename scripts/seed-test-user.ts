/* eslint-disable no-console */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const E2E_TEST_EMAIL = process.env.E2E_EMAIL ?? 'test@example.com';
const E2E_TEST_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

async function seedTestUser() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const service_role_key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !service_role_key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test');
    process.exit(1);
  }

  const supabaseAdmin = createClient(supabaseUrl, service_role_key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if user exists
  const {
    data: { users },
    error: listError,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError.message);
    process.exit(1);
  }

  const testUser = users.find((u) => u.email === E2E_TEST_EMAIL);

  if (testUser) {
    console.log('Test user already exists. Deleting and recreating...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUser.id);
    if (deleteError) {
      console.error('Error deleting existing test user:', deleteError.message);
      process.exit(1);
    }
  }

  console.log('Creating new test user...');
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: E2E_TEST_EMAIL,
    password: E2E_TEST_PASSWORD,
    email_confirm: true, // Auto-confirm email for testing
  });

  if (error) {
    console.error('Error creating test user:', error.message);
    process.exit(1);
  }

  console.log('Test user created successfully:', data.user.email);
}

seedTestUser();
