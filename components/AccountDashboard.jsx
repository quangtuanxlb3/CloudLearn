"use client";

import { useState } from "react";
import { DASHBOARD_SECTIONS } from "@/constants";
import DashboardLayout from "./DashboardLayout";
import ProfileForm from "./ProfileForm";
import PasswordChangeForm from "./PasswordChangeForm";
import StorageUsageCard from "./StorageUsageCard";
import AdminChat from "./AdminChat";
import DocumentManager from "./DocumentManager";

export default function AccountDashboard() {
  const [activeSection, setActiveSection] = useState(DASHBOARD_SECTIONS.PROFILE);

  return (
    <DashboardLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-apple-primary">
            Không gian học tập đám mây
          </p>
          <h1 className="text-2xl font-bold text-apple-text md:text-3xl">
            Bảng điều khiển CloudLearn
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-apple-muted">
            Quản lý hồ sơ, dung lượng, kho tài liệu có thể tìm kiếm và tin nhắn
            chia sẻ file trong một không gian học tập linh hoạt.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {(activeSection === DASHBOARD_SECTIONS.PROFILE ||
            activeSection === DASHBOARD_SECTIONS.SETTINGS) && (
            <>
              <ProfileForm />
              <PasswordChangeForm />
            </>
          )}

          {activeSection === DASHBOARD_SECTIONS.STORAGE && (
            <StorageUsageCard expanded />
          )}

          {activeSection === DASHBOARD_SECTIONS.SUPPORT && <AdminChat />}

          {activeSection === DASHBOARD_SECTIONS.DOCUMENTS && <DocumentManager />}

          {activeSection !== DASHBOARD_SECTIONS.STORAGE &&
            activeSection !== DASHBOARD_SECTIONS.SUPPORT &&
            activeSection !== DASHBOARD_SECTIONS.DOCUMENTS && (
              <StorageUsageCard />
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
