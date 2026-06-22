"use client";

import { useRouter } from "next/navigation";
import { NAV_ITEMS, ROLE_LABELS, USER_ROLES } from "@/constants";
import { useAuth } from "@/context/AuthContext";

const iconMap = {
  user: "U",
  document: "D",
  cloud: "C",
  chat: "A",
  settings: "S",
  dev: "<>",
};

export default function Sidebar({ isOpen, activeSection, onNavigate, onClose }) {
  const router = useRouter();
  const { logout, user } = useAuth();

  async function handleSignOut() {
    await logout();
    router.push("/");
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-black/35 lg:hidden"
          onClick={onClose}
          aria-label="Đóng lớp phủ thanh bên"
        />
      )}

      <aside
        id="account-sidebar"
        className={`fixed left-0 top-0 z-30 flex min-h-screen w-72 flex-col border-r border-apple-hairline bg-apple-nav p-6 shadow-apple transition-transform lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Điều hướng tài khoản"
      >
        <div className="mb-8 flex items-center justify-between gap-3 lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-[#EAF4FF] font-bold text-apple-primary">
              CL
            </div>
            <div>
              <h2 className="font-bold text-apple-text">CloudLearn</h2>
              <p className="text-xs text-apple-muted">Quản lý tài liệu</p>
            </div>
          </div>

          <button
            type="button"
            className="rounded-full border border-apple-hairline bg-white px-4 py-2 text-sm font-semibold text-apple-text transition hover:bg-apple-secondary focus:outline-none focus:ring-2 focus:ring-apple-primary lg:hidden"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        {user && (
          <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm">
            <p className="truncate text-sm font-bold text-apple-text">{user.fullName}</p>
            <p className="mt-1 truncate text-xs text-apple-muted">{user.email}</p>
            <span className="mt-3 inline-flex rounded-full bg-[#EAF4FF] px-3 py-1 text-xs font-bold text-apple-primary">
              {ROLE_LABELS[user.role] || "Tài khoản"}
            </span>
          </div>
        )}

        <nav className="space-y-2" aria-label="Các mục trong bảng điều khiển">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-apple-primary focus:ring-offset-2 ${
                  isActive
                    ? "bg-[#EAF4FF] text-apple-primary"
                    : "text-apple-muted hover:bg-white hover:text-apple-text"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs ${
                    isActive ? "bg-white text-apple-primary" : "bg-apple-secondary text-apple-muted"
                  }`}
                >
                  {iconMap[item.icon]}
                </span>
                {item.label}
              </button>
            );
          })}

          {user?.role === USER_ROLES.ADMIN && (
            <button
              type="button"
              onClick={() => {
                router.push("/dev");
                onClose();
              }}
              className={`flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-apple-primary focus:ring-offset-2 ${
                activeSection === "dev"
                  ? "bg-[#EAF4FF] text-apple-primary"
                  : "text-apple-muted hover:bg-white hover:text-apple-text"
              }`}
              aria-current={activeSection === "dev" ? "page" : undefined}
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs ${
                  activeSection === "dev"
                    ? "bg-white text-apple-primary"
                    : "bg-apple-secondary text-apple-muted"
                }`}
              >
                {iconMap.dev}
              </span>
              Dev Console
            </button>
          )}
        </nav>

        <div className="mt-auto rounded-3xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-apple-text">Học tập thông minh hơn</p>
          <p className="mt-1 text-xs leading-5 text-apple-muted">
            Đồng bộ ghi chú, slide bài giảng và bài tập trên nhiều thiết bị.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 w-full rounded-full border border-apple-hairline bg-white px-4 py-3 text-sm font-bold text-apple-text transition hover:bg-apple-secondary active:bg-[#E8E8ED] focus:outline-none focus:ring-2 focus:ring-apple-primary focus:ring-offset-2"
        >
          Đăng xuất
        </button>
      </aside>
    </>
  );
}
