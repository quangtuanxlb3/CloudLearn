"use client";

import { useEffect, useMemo, useState } from "react";
import { AWS_STORAGE_CONFIG } from "@/constants";
import { getDocuments, uploadDocument } from "@/services/documentService";

import { getCloudStorageConfig } from "@/services/storageService";

const MAX_FILE_SIZE_MB = 100;
const STORAGE_CLASSES = [

    "Standard",

    "Private",

    "Public",

];

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [cloudConfig, setCloudConfig] = useState(AWS_STORAGE_CONFIG);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [metadata, setMetadata] = useState({
    course: "Điện toán đám mây",
    folder: "Bài tập lớn",
    storageClass: "Standard",
  });
  const [progress, setProgress] = useState(0);
  const [isUploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([getDocuments(), getCloudStorageConfig()]).then(
      ([docs, config]) => {
        if (!isMounted) return;
        setDocuments(docs);
        setCloudConfig(config);
      },
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const totalSize = useMemo(() => {
    const filteredDocuments = documents.filter((doc) =>
  doc.name.toLowerCase().includes(searchTerm.toLowerCase())
);
    return documents
      .reduce((sum, item) => sum + Number(item.sizeMB || 0), 0)
      .toFixed(2);
  }, [documents]);
  const filteredDocuments = documents.filter((doc) =>
  doc.name.toLowerCase().includes(searchTerm.toLowerCase())
);

  function updateMetadata(event) {
    const { name, value } = event.target;
    setMetadata((current) => ({
    ...current,
    [name]: value,
    }));
    setStatus("");
    setError("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setStatus("");
    setError("");
    setProgress(0);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setSelectedFile(null);
      setError(`Tệp không được vượt quá ${MAX_FILE_SIZE_MB}MB trong bản demo.`);
      return;
    }

    setSelectedFile(file);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Vui lòng chọn tệp trước khi tải lên.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setStatus("Đang tạo presigned URL và tải lên Supabase...");
      const uploaded = await uploadDocument(
        selectedFile,
        metadata,
        setProgress,
      );
      setDocuments((current) => [uploaded, ...current]);
      setSelectedFile(null);
      setStatus("Tải lên thành công. Metadata đã được lưu vào hệ thống.");
      if (event.currentTarget) {
        event.currentTarget.reset();
      }
    } catch (uploadError) {
      setError(uploadError.message || "Không thể tải tệp lên.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-6 xl:col-span-3">
      <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-apple-primary">
          Supabase Storage
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-apple-text">
              Quản lý tài liệu học tập
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-apple-muted">
              Mô phỏng luồng tải tài liệu lên Supabase cho môn Điện toán đám mây
              tại Đại học GTVT TP HCM.
            </p>
          </div>
          <div className="rounded-3xl bg-apple-secondary px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-apple-muted">
              Tổng dữ liệu
            </p>
            <p className="mt-1 text-2xl font-bold text-apple-text">
              {totalSize}MB
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm"
          onSubmit={handleUpload}
        >
          <h3 className="text-lg font-bold text-apple-text">
            Tải tài liệu lên Cloud
          </h3>
          <p className="mt-1 text-sm text-apple-muted">
            Frontend chỉ gửi file đến presigned URL. Backend sau này sẽ giữ
            Supabase Authentication an toàn.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label
                className="mb-1.5 block text-sm font-semibold text-apple-text"
                htmlFor="document-file"
              >
                Chọn tệp
              </label>
              <input
                id="document-file"
                type="file"
                onChange={handleFileChange}
                disabled={isUploading}
                className="w-full rounded-2xl border border-apple-hairline bg-white px-4 py-3 text-sm text-apple-text file:mr-4 file:rounded-full file:border-0 file:bg-apple-primary file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:border-[#B8B8BD] focus:border-apple-primary focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 disabled:cursor-not-allowed disabled:bg-apple-secondary"
              />
              {selectedFile && (
                <p className="mt-2 text-xs text-apple-muted">
                  Đã chọn: {selectedFile.name} (
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                id="document-course"
                name="course"
                label="Môn học"
                value={metadata.course}
                onChange={updateMetadata}
                disabled={isUploading}
              />
              <TextField
                id="document-folder"
                name="folder"
                label="Thư mục"
                value={metadata.folder}
                onChange={updateMetadata}
                disabled={isUploading}
              />
              <div className="md:col-span-2">
                <label
                  className="mb-1.5 block text-sm font-semibold text-apple-text"
                  htmlFor="document-storage-class"
                >
                  Storage Class
                </label>
                <select
                  id="document-storage-class"
                  name="storageClass"
                  value={metadata.storageClass}
                  onChange={updateMetadata}
                  disabled={isUploading}
                  className="w-full rounded-2xl border border-apple-hairline bg-white px-4 py-3 text-sm text-apple-text outline-none transition hover:border-[#B8B8BD] focus:border-apple-primary focus:ring-2 focus:ring-[#0071E3]/20 disabled:cursor-not-allowed disabled:bg-apple-secondary"
                >
                  {STORAGE_CLASSES.map((storageClass) => (
                    <option key={storageClass} value={storageClass}>
                      {storageClass}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isUploading && (
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-apple-muted">Tiến trình upload</span>
                  <span className="font-bold text-apple-text">{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-apple-secondary">
                  <div
                    className="h-full rounded-full bg-apple-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status && (
              <p className="rounded-2xl bg-[#EAF4FF] px-4 py-3 text-sm text-apple-primary">
                {status}
              </p>
            )}
            {error && (
              <p className="rounded-2xl bg-[#FFF2F2] px-4 py-3 text-sm text-apple-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full rounded-full bg-apple-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-apple-link active:bg-[#0055B8] disabled:cursor-not-allowed disabled:bg-apple-hairline"
            >
              {isUploading ? "Đang tải lên..." : "Tải lên Cloud"}
            </button>
          </div>
        </form>

        <aside className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-apple-text">
            Cấu hình cloud dự kiến
          </h3>
          <div className="mt-5 space-y-3">
            <ConfigRow label="Provider" value={cloudConfig.provider} />
            <ConfigRow label="Bucket" value={cloudConfig.bucketName} />
            <ConfigRow label="Region" value={cloudConfig.region} />
            <ConfigRow
              label="Upload"
              value={cloudConfig.accessPattern || "Supabase Storage"}
            />
            <ConfigRow label="Encryption" value={cloudConfig.encryption} />
            <ConfigRow label="Versioning" value={cloudConfig.versioning} />
          </div>
          <div className="mt-5 rounded-3xl bg-apple-secondary p-4">
            <p className="text-sm font-bold text-apple-text">Lifecycle rule</p>
            <p className="mt-1 text-sm leading-6 text-apple-muted">
              {cloudConfig.lifecycle}
            </p>
          </div>
        </aside>
      </div>

      <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-apple-text">
              Danh sách tài liệu
            </h3>
            <input
  type="text"
  placeholder="Tìm kiếm tài liệu..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="mt-3 w-full rounded-2xl border border-apple-hairline px-4 py-2"
/>
            <p className="mt-1 text-sm text-apple-muted">
              Metadata mẫu để sau này map với GET /api/documents.
            </p>
          </div>
          <span className="w-fit rounded-full bg-apple-secondary px-3 py-1 text-xs font-bold text-apple-muted">
            {documents.length} tệp
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-apple-hairline">
          <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_0.8fr] gap-4 bg-apple-secondary px-4 py-3 text-xs font-bold uppercase tracking-wide text-apple-muted md:grid">
            <span>Tên tệp</span>
            <span>Môn / thư mục</span>
            <span>Dung lượng</span>
            <span>Trạng thái</span>
          </div>
          <div className="divide-y divide-apple-hairline">
  {filteredDocuments.map((doc) => (
                <article
  key={doc.id}
  className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.4fr_1fr_0.8fr_0.8fr] md:items-center md:gap-4"
>
  <div className="min-w-0">
                  <p className="truncate font-bold text-apple-text">
                    {doc.name}
                  </p>

                  <div className="flex gap-3 mt-1">
  <a
    href={doc.s3Key}
    target="_blank"
    rel="noreferrer"
    className="text-blue-500 hover:underline text-xs"
  >
    Xem
  </a>

  <a
    href={doc.s3Key}
    download
    className="text-green-600 hover:underline text-xs"
  >
    Tải xuống
  </a>
</div>
                </div>

                <div>
                  <p className="font-semibold text-apple-text">
                    {doc.course}
                  </p>

                  <p className="mt-1 text-xs text-apple-muted">
                    {doc.folder}
                  </p>
                </div>

                <p className="font-semibold text-apple-text">
                  {doc.sizeMB} MB
                </p>

                <p className="mt-1 text-xs text-apple-muted">
                  {doc.storageClass}
                </p>

                <div>
                  <span className="inline-flex rounded-full bg-[#EAF7EA] px-3 py-1 text-xs font-bold text-apple-success">
                    Đã tải lên
                  </span>

                  <p className="mt-1 text-xs text-apple-muted">
                    {doc.uploadedAt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TextField({ id, label, ...props }) {
  return (
    <div>
      <label
        className="mb-1.5 block text-sm font-semibold text-apple-text"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-2xl border border-apple-hairline bg-white px-4 py-3 text-sm text-apple-text outline-none transition placeholder:text-[#A1A1A6] hover:border-[#B8B8BD] focus:border-apple-primary focus:ring-2 focus:ring-[#0071E3]/20 disabled:cursor-not-allowed disabled:bg-apple-secondary"
        {...props}
      />
    </div>
  );
}

function ConfigRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-apple-secondary px-4 py-3">
      <span className="text-sm font-semibold text-apple-muted">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-bold text-apple-text">
        {value}
      </span>
    </div>
  );
}
