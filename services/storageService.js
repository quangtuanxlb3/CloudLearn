import { supabase } from "@/lib/supabase";
import { getDocuments as getSupabaseDocuments } from "./documentService";
import { getCurrentUser } from "./userService";

/**
 * Lấy thông tin dung lượng storage
 */
export async function getStorageUsage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.isDemo) {
    return {
      usedGB: currentUser.storageUsedGB,
      limitGB: currentUser.storageLimitGB,
      documentCount: currentUser.documentCount || 0,
      folderCount: currentUser.folderCount || 0,
      limits: currentUser.limits || null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      usedGB: 0,
      limitGB: 2,
      documentCount: 0,
      folderCount: 0,
    };
  }

  const { data, error } = await supabase
    .from("documents")
    .select("file_size")
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const totalBytes =
    data?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;

  const usedGB = Number(
    (totalBytes / (1024 * 1024 * 1024)).toFixed(2)
  );

  return {

    usedGB,

    limitGB: 2,

    documentCount: data?.length || 0,

    folderCount: 1,

  };
}

/**
 * Lấy danh sách tài liệu
 */
export async function getDocuments() {
  return getSupabaseDocuments();
}

export async function getCloudStorageConfig() {
  return {
    provider: "Supabase",
    bucketName: "documents",
    region: "Supabase Cloud",
    accessPattern: "Supabase Storage",
    encryption: "AES-256",
    versioning: "Enabled",
    lifecycle: "Keep forever",
  };
}
