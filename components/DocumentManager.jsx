"use client";

import { useEffect, useMemo, useState } from "react";
import { AWS_STORAGE_CONFIG } from "@/constants";
import {
  deleteDocument,
  getDocuments,
  uploadDocument,
} from "@/services/documentService";
import { getCloudStorageConfig } from "@/services/storageService";

const MAX_FILE_SIZE_MB = 100;
const STORAGE_CLASSES = ["Public", "Private", "Standard"];
const VIEW_TABS = [
  { id: "community", label: "Cộng đồng" },
  { id: "mine", label: "Tài liệu của tôi" },
];

function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function isPublicDocument(doc) {
  return doc.storageClass === "Public" || doc.storageClass === "Standard";
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [cloudConfig, setCloudConfig] = useState(AWS_STORAGE_CONFIG);
  const [selectedFile, setSelectedFile] = useState(null);
  const [metadata, setMetadata] = useState({
    course: "Điện toán đám mây",
    folder: "Bài tập lớn",
    storageClass: "Public",
  });
  const [progress, setProgress] = useState(0);
  const [isUploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("community");
  const [copiedId, setCopiedId] = useState("");

  const totalSizeLabel = useMemo(() => {
    const totalBytes = documents.reduce(
      (sum, item) =>
        sum + Number(item.sizeBytes || Number(item.sizeMB || 0) * 1024 * 1024),
      0,
    );

    return formatFileSize(totalBytes);
  }, [documents]);

  const visibleDocuments = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();
    const source =
      activeTab === "community"
        ? documents.filter(isPublicDocument)
        : documents;

    if (!cleanSearch) return source;

    return source.filter((doc) =>
      [doc.name, doc.course, doc.folder, doc.fileType, doc.fileExtension]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(cleanSearch)),
    );
  }, [activeTab, documents, searchTerm]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getDocuments(), getCloudStorageConfig()])
      .then(([docs, config]) => {
        if (!isMounted) return;
        setDocuments(docs);
        setCloudConfig(config);
      })
      .catch((loadError) => {
        if (!isMounted) return;
        setError(loadError.message || "Không thể tải danh sách tài liệu.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      setStatus("Đang tải tệp lên Supabase Storage...");
      const uploaded = await uploadDocument(selectedFile, metadata, setProgress);
      setDocuments((current) => [uploaded, ...current]);
      setSelectedFile(null);
      setActiveTab(isPublicDocument(uploaded) ? "community" : "mine");
      setStatus(
        metadata.storageClass === "Private"
          ? "Tải lên thành công. Tài liệu đang ở chế độ riêng tư."
          : "Tải lên thành công. Người khác có thể tìm và tải tài liệu này.",
      );
      event.currentTarget?.reset();
    } catch (uploadError) {
      setError(uploadError.message || "Không thể tải tệp lên.");
    } finally {
      setUploading(false);
    }
  }

  function handleDownload(doc) {
    if (!doc.s3Key) {
      setError("Tài liệu này chưa có đường dẫn tải xuống.");
      return;
    }

    setError("");
    setStatus(`Đã bắt đầu tải "${doc.name}" về máy.`);

    const params = new URLSearchParams({
      url: doc.s3Key,
      name: doc.name || "tai-lieu",
    });
    const link = document.createElement("a");

    link.href = `/api/documents/download?${params.toString()}`;
    link.download = doc.name || "tai-lieu";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function getShareLink(doc) {
    if (typeof window === "undefined" || !doc.s3Key) return "";

    const params = new URLSearchParams({
      url: doc.s3Key,
      name: doc.name || "tai-lieu",
      type: doc.fileType || "",
      size: doc.sizeLabel || "",
    });

    return `${window.location.origin}/share?${params.toString()}`;
  }

  async function handleCopyShareLink(doc) {
    if (!doc.s3Key) {
      setError("Tài liệu này chưa có đường dẫn chia sẻ.");
      return;
    }

    const shareLink = getShareLink(doc);

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedId(doc.id);
      setError("");
      setStatus(`Đã sao chép link chia sẻ cho "${doc.name}".`);
      window.setTimeout(() => setCopiedId(""), 1800);
    } catch {
      setError("Không thể sao chép link. Hãy mở link chia sẻ rồi copy thủ công.");
    }
  }

  async function handleDelete(doc) {
    const shouldDelete = window.confirm(
      `Bạn có chắc muốn xóa tài liệu "${doc.name}" không?`,
    );

    if (!shouldDelete) return;

    try {
      setDeletingId(doc.id);
      setError("");
      setStatus("");
      await deleteDocument(doc);
      setDocuments((current) => current.filter((item) => item.id !== doc.id));
      setStatus(`Đã xóa tài liệu "${doc.name}".`);
    } catch (deleteError) {
      setError(deleteError.message || "Không thể xóa tài liệu.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <section className="space-y-6 xl:col-span-3">
      <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-apple-primary">
          CloudLearn Social Docs
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-apple-text">
              Chia sẻ và tìm kiếm tài liệu học tập
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-apple-muted">
              Tải tài liệu lên cloud, đặt chế độ công khai để bạn bè tìm thấy,
              hoặc giữ riêng tư cho kho cá nhân.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <Metric label="Tổng dữ liệu" value={totalSizeLabel} />
            <Metric
              label="Public"
              value={documents.filter(isPublicDocument).length}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <form
          className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm"
          onSubmit={handleUpload}
        >
          <h3 className="text-lg font-bold text-apple-text">
            Đăng tài liệu lên cộng đồng
          </h3>
          <p className="mt-1 text-sm text-apple-muted">
            Chọn Public để người khác tìm kiếm và tải về, hoặc Private nếu chỉ
            muốn lưu cho riêng bạn.
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
                label="Chủ đề / thư mục"
                value={metadata.folder}
                onChange={updateMetadata}
                disabled={isUploading}
              />
              <div className="md:col-span-2">
                <label
                  className="mb-1.5 block text-sm font-semibold text-apple-text"
                  htmlFor="document-storage-class"
                >
                  Chế độ chia sẻ
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
              {isUploading ? "Đang tải lên..." : "Đăng tài liệu"}
            </button>
          </div>
        </form>

        <aside className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-apple-text">
            Luồng sử dụng kiểu mạng xã hội
          </h3>
          <div className="mt-5 space-y-3">
            <ConfigRow label="Upload" value="Tệp + môn học + chủ đề" />
            <ConfigRow label="Tìm kiếm" value="Tên, môn, thư mục, loại file" />
            <ConfigRow label="Tải về" value="Public docs tải trực tiếp" />
            <ConfigRow label="Lưu trữ" value={cloudConfig.bucketName} />
          </div>
          <div className="mt-5 rounded-3xl bg-apple-secondary p-4">
            <p className="text-sm font-bold text-apple-text">
              Gợi ý backend tiếp theo
            </p>
            <p className="mt-1 text-sm leading-6 text-apple-muted">
              Có thể thêm bảng likes, comments và messages để biến feed này
              thành mạng xã hội realtime hoàn chỉnh.
            </p>
          </div>
        </aside>
      </div>

      <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="text-lg font-bold text-apple-text">
              Kho tài liệu có thể tìm kiếm
            </h3>
            <p className="mt-1 text-sm text-apple-muted">
              Tạo link chia sẻ để người nhận mở xem hoặc tải file mà không cần
              đăng nhập vào tài khoản của bạn.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-full bg-apple-secondary p-1">
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    activeTab === tab.id
                      ? "bg-white text-apple-primary shadow-sm"
                      : "text-apple-muted hover:text-apple-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Tìm tên, môn học, loại file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-w-[260px] rounded-full border border-apple-hairline bg-[#F5F5F7] px-4 py-2 text-sm text-apple-text outline-none transition focus:border-apple-primary focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
            />
            <span className="whitespace-nowrap rounded-full bg-apple-secondary px-3 py-1 text-xs font-bold text-apple-muted">
              {visibleDocuments.length} tệp
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-apple-hairline">
          <div className="hidden grid-cols-[1.35fr_0.95fr_0.55fr_0.65fr_0.75fr_0.8fr] gap-4 bg-apple-secondary px-4 py-3 text-xs font-bold uppercase tracking-wide text-apple-muted md:grid">
            <span>Tên tệp</span>
            <span>Môn / chủ đề</span>
            <span>Loại</span>
            <span>Dung lượng</span>
            <span>Chế độ</span>
            <span className="text-right">Thao tác</span>
          </div>
          <div className="divide-y divide-apple-hairline">
            {visibleDocuments.map((doc) => (
              <article
                key={doc.id}
                className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.35fr_0.95fr_0.55fr_0.65fr_0.75fr_0.8fr] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-apple-text">
                    {doc.name}
                  </p>
                  <a
                    href={doc.s3Key}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block truncate text-xs text-blue-500 hover:underline"
                  >
                    Xem tài liệu
                  </a>
                </div>

                <div>
                  <p className="font-semibold text-apple-text">{doc.course}</p>
                  <p className="mt-1 text-xs text-apple-muted">{doc.folder}</p>
                </div>

                <div>
                  <span className="inline-flex max-w-full rounded-full bg-apple-secondary px-3 py-1 text-xs font-bold uppercase text-apple-muted">
                    {doc.fileExtension || "FILE"}
                  </span>
                  {doc.fileType && (
                    <p className="mt-1 truncate text-xs text-apple-muted">
                      {doc.fileType}
                    </p>
                  )}
                </div>

                <p className="font-semibold text-apple-text">
                  {doc.sizeLabel || `${doc.sizeMB} MB`}
                </p>

                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      isPublicDocument(doc)
                        ? "bg-[#EAF7EA] text-apple-success"
                        : "bg-[#FFF7E6] text-[#A45B00]"
                    }`}
                  >
                    {isPublicDocument(doc) ? "Public" : "Private"}
                  </span>
                  <p className="mt-1 text-xs text-apple-muted">
                    {doc.uploadedAt}
                  </p>
                </div>

                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    className="rounded-full border border-apple-hairline bg-white px-3 py-1.5 text-xs font-bold text-apple-primary transition hover:border-apple-primary hover:bg-[#EAF4FF]"
                  >
                    Tải về
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(doc)}
                    className="rounded-full border border-apple-hairline bg-white px-3 py-1.5 text-xs font-bold text-apple-text transition hover:border-apple-primary hover:bg-[#EAF4FF]"
                  >
                    {copiedId === doc.id ? "Đã copy" : "Copy link"}
                  </button>
                  <a
                    href={getShareLink(doc)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-apple-hairline bg-white px-3 py-1.5 text-xs font-bold text-apple-text transition hover:border-apple-primary hover:bg-[#EAF4FF]"
                  >
                    Mở link
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="rounded-full border border-[#FFD7D7] bg-white px-3 py-1.5 text-xs font-bold text-apple-error transition hover:bg-[#FFF2F2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === doc.id ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </article>
            ))}

            {visibleDocuments.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-apple-muted">
                Chưa có tài liệu phù hợp. Hãy thử từ khóa khác hoặc đăng tài
                liệu mới.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-3xl bg-apple-secondary px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-apple-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-apple-text">{value}</p>
    </div>
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
