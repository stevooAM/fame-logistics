"use client";

import { useState } from "react";
import { UserTable } from "./components/UserTable";
import { UserFormDialog } from "./components/UserFormDialog";
import { TempPasswordDialog } from "./components/TempPasswordDialog";
import type { UserProfile } from "@/types/user";

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function refresh() {
    setRefreshTrigger((n) => n + 1);
  }

  function handleUserCreated(password: string) {
    setTempPassword(password);
    refresh();
  }

  function handleUserUpdated() {
    refresh();
  }

  function handleEdit(user: UserProfile) {
    setEditUser(user);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2B3E50]">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage staff accounts, roles, and access.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#1F7A8C" }}
        >
          + Create User
        </button>
      </div>

      {/* User list */}
      <UserTable onEdit={handleEdit} refreshTrigger={refreshTrigger} />

      {/* Create dialog */}
      <UserFormDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />

      {/* Edit dialog */}
      <UserFormDialog
        open={editUser !== null}
        mode="edit"
        user={editUser}
        onClose={() => setEditUser(null)}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />

      {/* Temp password dialog */}
      <TempPasswordDialog
        open={tempPassword !== null}
        tempPassword={tempPassword ?? ""}
        onClose={() => setTempPassword(null)}
      />
    </div>
  );
}
