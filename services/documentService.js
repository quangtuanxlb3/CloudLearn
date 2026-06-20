import { supabase } from "@/lib/supabase";

function toMB(bytes) {
  return Number((bytes / (1024 * 1024)).toFixed(2));
}

/**
 * Lấy danh sách tài liệu
 */
export async function getDocuments() {

    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return (data || []).map(doc => ({

        id: doc.id,

        name: doc.file_name,

        course: doc.course || "Điện toán đám mây",

        folder: doc.folder || "Tài liệu",

        sizeMB: Number(
            (doc.file_size / 1024 / 1024).toFixed(2)
        ),

        storageClass: doc.storage_class || "Supabase Storage",

        status: "Đã đồng bộ",

        uploadedAt: new Date(doc.created_at)
            .toLocaleDateString("vi-VN"),

        s3Key: doc.file_url,

    }));

}

/**
 * Upload tài liệu
 */
export async function uploadDocument(file, metadata, onProgress) {

  if (!file) {
    throw new Error("Vui lòng chọn file.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Bạn chưa đăng nhập.");
  }

  const filePath = `${user.id}/${Date.now()}_${file.name}`;

  onProgress?.(10);

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  onProgress?.(60);

  const { data } = supabase.storage
  .from("documents")
  .getPublicUrl(filePath);

const publicUrl = data.publicUrl;

const { data: document, error } = await supabase
  .from("documents")
  .insert({
    title: file.name,
    file_name: file.name,
    file_url: publicUrl,
    file_size: file.size,
    file_type: file.type,
    owner_id: user.id,
    course: metadata.course,
    folder: metadata.folder,
    storage_class: metadata.storageClass,
  })
  .select()
  .single();

  if (error) {
    throw new Error(error.message);
  }

  onProgress?.(100);

  return {
    id: document.id,
    name: document.file_name,
    course: document.course,
    folder: document.folder,
    sizeMB: Number(
      (document.file_size / 1024 / 1024).toFixed(2)
    ),
    storageClass: document.storage_class,
    status: "Đã đồng bộ",
    uploadedAt: new Date(document.created_at)
      .toLocaleDateString("vi-VN"),
    s3Key: document.file_url,
  };
}

/**
 * Thông tin storage
 */
export async function getCloudStorageConfig() {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {

    return {
      provider: "Supabase Storage",
      bucket: "documents",
      totalFiles: 0,
      totalSizeMB: 0,
    };

  }

  const { data } = await supabase
    .from("documents")
    .select("file_size")
    .eq("owner_id", user.id);
  const totalSize =
    data?.reduce((sum, item) => sum + (item.file_size || 0), 0) || 0;

  return {

    provider: "Supabase Storage",

    bucket: "documents",

    totalFiles: data?.length || 0,

    totalSizeMB: toMB(totalSize),

  };
}