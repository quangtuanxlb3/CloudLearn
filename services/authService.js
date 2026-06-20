// Authentication service.
// Mock implementations now; real fetch calls (see commented examples) later.

import { API_ENDPOINTS, USER_ROLES } from "@/constants";
import { mockCredentials, mockUser } from "@/lib/mockData";
import { clearAuthToken, delay, setAuthToken /*, request, USE_MOCK */ } from "./apiClient";
import { setCurrentUser } from "./userService";
import { supabase } from "@/lib/supabase";

function makeToken() {
  return `mock.${Math.random().toString(36).slice(2)}.${Date.now()}`;
}

/**
 * POST /api/auth/login
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  const token = data.session.access_token;

  setAuthToken(token);
  setCurrentUser(profile);

  return {
    user: profile,
    token,
  };
}

/**
 * POST /api/auth/register
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerUser({
  fullName,
  email,
  password,
}) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Không thể tạo tài khoản.");
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    full_name: fullName,
    email: email.trim().toLowerCase(),
    role: USER_ROLES.STUDENT,
    storage_used_gb: 0,
  });

  const token = data.session?.access_token ?? "";

  setAuthToken(token);

  const user = {
    id: data.user.id,
    full_name: fullName,
    email,
    role: USER_ROLES.STUDENT,
    storage_used_gb: 0,
  };

  setCurrentUser(user);

  return {
    user,
    token,
  };
}

/**
 * Social auth placeholder (Google / GitHub). Real flow would redirect to an OAuth URL.
 */
export async function socialLogin(provider) {
  await delay(500);
  const token = makeToken();
  setAuthToken(token);
  const user = { ...mockUser, provider };
  setCurrentUser(user);
  return { user, token };
}

export async function logoutUser() {
  await supabase.auth.signOut();
  clearAuthToken();
}

export { API_ENDPOINTS };
