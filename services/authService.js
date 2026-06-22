// Authentication service.
// Mock implementations now; real fetch calls (see commented examples) later.

import { API_ENDPOINTS, USER_ROLES } from "@/constants";
import { getMockUserByEmail, mockCredentials, mockUser } from "@/lib/mockData";
import { clearAuthToken, delay, setAuthToken /*, request, USE_MOCK */ } from "./apiClient";
import { normalizeUser, setCurrentUser } from "./userService";
import { supabase } from "@/lib/supabase";

function makeToken(email = "") {
  const identity = encodeURIComponent(email || "demo");

  return `mock.${identity}.${Date.now()}`;
}

/**
 * POST /api/auth/login
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const demoCredential = mockCredentials.find(
    (credential) =>
      credential.email === normalizedEmail && credential.password === password,
  );

  if (demoCredential) {
    await delay(300);
    const token = makeToken(normalizedEmail);
    const demoUser = getMockUserByEmail(normalizedEmail) || mockUser;
    const user = normalizeUser({
      ...demoUser,
      email: normalizedEmail,
      isDemo: true,
    });

    setAuthToken(token);
    setCurrentUser(user);

    return {
      user,
      token,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
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

  const user = normalizeUser(profile);

  setAuthToken(token);
  setCurrentUser(user);

  return {
    user,
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

  const user = normalizeUser({
    id: data.user.id,
    fullName,
    full_name: fullName,
    email,
    role: USER_ROLES.STUDENT,
    storage_used_gb: 0,
  });

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
  const token = makeToken(provider.toLowerCase());
  setAuthToken(token);
  const user = { ...mockUser, provider };
  setCurrentUser(user);
  return { user, token };
}

export async function logoutUser() {
  await supabase.auth.signOut();
  clearAuthToken();
  setCurrentUser(null);
}

export { API_ENDPOINTS };
