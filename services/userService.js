import { supabase } from "@/lib/supabase";

let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
}

/**
 * Lấy thông tin người dùng hiện tại
 */
export async function getCurrentUser() {

  if (currentUser) {
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

  currentUser = data;

  return data;
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

  currentUser = data;

  return data;
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