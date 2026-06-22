import { supabase } from "@/lib/supabase";
import { getMockUserByEmail, mockUser } from "@/lib/mockData";
import { getAuthToken } from "./apiClient";

let currentUser = null;

export function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    fullName: user.fullName || user.full_name || user.email || "Người dùng",
    avatarUrl: user.avatarUrl || user.avatar_url || "",
    storageUsedGB: user.storageUsedGB ?? user.storage_used_gb ?? 0,
    storageLimitGB: user.storageLimitGB ?? user.storage_limit_gb ?? 2,
  };
}

export function setCurrentUser(user) {
  currentUser = normalizeUser(user);
}

/**
 * Lấy thông tin người dùng hiện tại
 */
export async function getCurrentUser() {

  if (currentUser) {
    return currentUser;
  }

  const token = getAuthToken();

  if (token?.startsWith("mock.")) {
    const [, encodedEmail = ""] = token.split(".");
    const email = decodeURIComponent(encodedEmail);
    const demoUser = getMockUserByEmail(email) || mockUser;

    currentUser = normalizeUser({
      ...demoUser,
      isDemo: true,
    });

    return currentUser;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  currentUser = normalizeUser(data);

  return currentUser;
}

/**
 * Cập nhật hồ sơ
 */
export async function updateProfile(updates) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({

      full_name: updates.fullName,

      email: updates.email,

      role: updates.role,

      institution: updates.institution,

    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  currentUser = normalizeUser(data);

  return currentUser;
}

/**
 * Đổi mật khẩu
 */
export async function changePassword({
  currentPassword,
  newPassword,
}) {

  if (!newPassword) {
    throw new Error("Vui lòng nhập mật khẩu mới.");
  }

  const { error } = await supabase.auth.updateUser({

    password: newPassword,

  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
  };
}
