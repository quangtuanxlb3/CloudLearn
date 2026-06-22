"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const router = useRouter();
  const { isAuthenticated, isAuthReady, user } = useAuth();
  const isAllowed =
    !allowedRoles?.length || (user?.role && allowedRoles.includes(user.role));

  useEffect(() => {
    if (isAuthReady && !isAuthenticated) {
      router.replace("/");
    }

    if (isAuthReady && isAuthenticated && !isAllowed) {
      router.replace("/dashboard");
    }
  }, [isAuthReady, isAuthenticated, isAllowed, router]);

  if (!isAuthReady) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-soft">
          Đang kiểm tra phiên đăng nhập...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-soft">
          Đang chuyển về trang đăng nhập...
        </div>
      </main>
    );
  }

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-soft">
          Tài khoản này không có quyền vào trang dev.
        </div>
      </main>
    );
  }

  return children;
}
