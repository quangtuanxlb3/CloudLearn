import { supabase } from "@/lib/supabase";

function toMB(bytes = 0) {
  return Number((Number(bytes || 0) / (1024 * 1024)).toFixed(2));
}

function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getFileExtension(fileName = "") {
  const extension = fileName.split(".").pop();

  if (!extension || extension === fileName) return "FILE";

  return extension.toUpperCase();
}

function getStoragePathFromPublicUrl(fileUrl) {
  if (!fileUrl) return "";

  const marker = "/storage/v1/object/public/documents/";
  const markerIndex = fileUrl.indexOf(marker);

  if (markerIndex === -1) return "";

  return decodeURIComponent(fileUrl.slice(markerIndex + marker.length));
}

function mapDocument(doc) {
  const fileName = doc.file_name || doc.title || "tai-lieu";

  return {
    id: doc.id,
    name: fileName,
    course: doc.course || "Điện toán đám mây",
    folder: doc.folder || "Tài liệu",
    sizeBytes: doc.file_size || 0,
    sizeMB: toMB(doc.file_size),
    sizeLabel: formatFileSize(doc.file_size),
    fileType: doc.file_type || getFileExtension(fileName),
    fileExtension: getFileExtension(fileName),
    storageClass: doc.storage_class || "Public",
    status: "Đã đồng bộ",
    uploadedAt: doc.created_at
      ? new Date(doc.created_at).toLocaleDateString("vi-VN")
      : "",
    s3Key: doc.file_url,
    filePath: getStoragePathFromPublicUrl(doc.file_url),
    ownerId: doc.owner_id,
  };
}

export async function getDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapDocument);
}

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

  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
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
    ...mapDocument(document),
    filePath,
  };
}

export async function deleteDocument(document) {
  if (!document?.id) {
    throw new Error("Không tìm thấy tài liệu cần xóa.");
  }

  const filePath =
    document.filePath || getStoragePathFromPublicUrl(document.s3Key);

  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([filePath]);

    if (storageError) {
      throw new Error(storageError.message);
    }
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", document.id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

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
