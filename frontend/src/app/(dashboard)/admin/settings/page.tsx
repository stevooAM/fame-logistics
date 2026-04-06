"use client";

import { CompanyProfileForm } from "./components/CompanyProfileForm";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#2B3E50]">Company Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your company profile, logo, and contact details.
        </p>
      </div>

      <CompanyProfileForm />
    </div>
  );
}
