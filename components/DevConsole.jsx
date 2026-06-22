"use client";

import { useRouter } from "next/navigation";
import DashboardLayout from "./DashboardLayout";
import { useAuth } from "@/context/AuthContext";

const LIMIT_LABELS = {
  maxUploadSizeMB: "Upload tối đa",
  maxDocuments: "Tài liệu tối đa",
  maxFolders: "Thư mục tối đa",
  maxUsers: "Người dùng tối đa",
  maxCourses: "Khóa học tối đa",
  maxStorageBuckets: "Bucket tối đa",
  maxConcurrentUploads: "Upload đồng thời",
  maxShareLinks: "Link chia sẻ tối đa",
  apiRequestsPerDay: "API/ngày",
  retentionDays: "Thời hạn lưu",
  auditLogRetentionDays: "Lưu audit log",
  allowedFileTypes: "Loại file cho phép",
  canManageUsers: "Quản lý người dùng",
  canDeleteAnyDocument: "Xóa mọi tài liệu",
};

function formatLimitValue(key, value) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Được phép" : "Không";
  if (key === "maxUploadSizeMB") return `${value}MB/tệp`;
  if (key === "retentionDays" || key === "auditLogRetentionDays") {
    return `${value} ngày`;
  }

  return value;
}

export default function DevConsole() {
  const router = useRouter();
  const { user } = useAuth();
  const limits = user?.limits || {};
  const limitItems = Object.entries(limits);

  return (
    <DashboardLayout
      activeSection="dev"
      onSectionChange={() => router.push("/dashboard")}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-apple-primary">
            Dev Console
          </p>
          <h1 className="text-2xl font-bold text-apple-text md:text-3xl">
            Trang quản trị dành cho dev
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-apple-muted">
            Khu vực kiểm tra tài khoản admin, giới hạn hệ thống và cấu hình môi
            trường demo.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard label="Tài khoản" value={user?.fullName || "Admin"} />
          <InfoCard label="Email" value={user?.email || "admin@cloudlearn.local"} />
          <InfoCard label="Vai trò" value={user?.role || "admin"} />
        </section>

        <section className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-apple-text">
                Giới hạn tài khoản dev
              </h2>
              <p className="mt-1 text-sm text-apple-muted">
                Các quota này chỉ dùng cho tài khoản admin demo trong môi trường
                phát triển.
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#EAF4FF] px-3 py-1 text-xs font-bold text-apple-primary">
              {limitItems.length} giới hạn
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {limitItems.map(([key, value]) => (
              <InfoCard
                key={key}
                label={LIMIT_LABELS[key] || key}
                value={formatLimitValue(key, value)}
                compact
              />
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-apple-text">Storage demo</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoCard label="Đã dùng" value={`${user?.storageUsedGB ?? 0}GB`} compact />
              <InfoCard label="Giới hạn" value={`${user?.storageLimitGB ?? 0}GB`} compact />
              <InfoCard label="Tài liệu" value={user?.documentCount ?? 0} compact />
              <InfoCard label="Thư mục" value={user?.folderCount ?? 0} compact />
            </div>
          </div>

          <div className="rounded-[28px] border border-apple-hairline bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-apple-text">Môi trường</h2>
            <div className="mt-4 space-y-3">
              <ConfigRow
                label="Supabase URL"
                value={
                  process.env.NEXT_PUBLIC_SUPABASE_URL ? "Đã cấu hình" : "Thiếu"
                }
              />
              <ConfigRow
                label="Publishable key"
                value={
                  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                    ? "Đã cấu hình"
                    : "Thiếu"
                }
              />
              <ConfigRow label="Download API" value="/api/documents/download" />
              <ConfigRow label="Dev route" value="/dev" />
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function InfoCard({ label, value, compact = false }) {
  return (
    <div
      className={`rounded-2xl border border-apple-hairline bg-white ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-apple-muted">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-bold text-apple-text">
        {String(value)}
      </p>
    </div>
  );
}

function ConfigRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-apple-secondary px-4 py-3">
      <span className="text-sm font-semibold text-apple-muted">{label}</span>
      <span className="max-w-[58%] break-words text-right text-sm font-bold text-apple-text">
        {value}
      </span>
    </div>
  );
}
