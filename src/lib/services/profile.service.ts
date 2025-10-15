import type { ProfileDto } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

/**
 * Get current user's profile
 * @param userId - User UUID from auth context
 * @param supabase - Supabase client instance
 * @returns User profile or null if not found
 */
export async function getCurrentUserProfile(
  userId: string,
  supabase: SupabaseClient
): Promise<ProfileDto | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw error;
  }

  return data as ProfileDto;
}

/**
 * Update current user's profile
 * @param userId - User UUID from auth context
 * @param command - Partial profile update data
 * @param supabase - Supabase client instance
 * @returns Updated profile or null if not found
 */
export async function updateCurrentUserProfile(
  userId: string,
  command: {
    display_name?: string;
    avatar_url?: string | null;
  },
  supabase: SupabaseClient
): Promise<ProfileDto | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update(command)
    .eq("id", userId)
    .select("id, display_name, avatar_url, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return null;
    }
    throw error;
  }

  return data as ProfileDto;
}
