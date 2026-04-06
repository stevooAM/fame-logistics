"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type {
  UserProfile,
  UserRole,
  UserCreatePayload,
  UserCreateResponse,
  UserUpdatePayload,
} from "@/types/user";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const createSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  email: z.string().email("Enter a valid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role_id: z.number({ required_error: "Role is required" }).min(1, "Role is required"),
  phone: z.string().optional(),
  department: z.string().optional(),
});

const editSchema = createSchema.omit({ username: true });

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UserFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  user?: UserProfile | null;
  onClose: () => void;
  onUserCreated: (tempPassword: string) => void;
  onUserUpdated: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserFormDialog({
  open,
  mode,
  user,
  onClose,
  onUserCreated,
  onUserUpdated,
}: UserFormDialogProps) {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(isEdit ? (editSchema as unknown as typeof createSchema) : createSchema),
    defaultValues: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      role_id: undefined,
      phone: "",
      department: "",
    },
  });

  // Load roles when dialog opens
  useEffect(() => {
    if (!open) return;

    setRolesLoading(true);
    apiFetch<UserRole[]>("/api/roles/")
      .then(setRoles)
      .catch(() => setRoles([]))
      .finally(() => setRolesLoading(false));
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;

    if (isEdit && user) {
      reset({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role?.id ?? undefined,
        phone: user.phone ?? "",
        department: user.department ?? "",
      });
    } else {
      reset({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role_id: undefined,
        phone: "",
        department: "",
      });
    }
    setApiError(null);
  }, [open, isEdit, user, reset]);

  const selectedRoleId = watch("role_id");

  async function onSubmit(values: CreateFormValues) {
    setSubmitting(true);
    setApiError(null);

    try {
      if (isEdit && user) {
        const payload: UserUpdatePayload = {
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          role_id: values.role_id,
          phone: values.phone,
          department: values.department,
        };
        await apiFetch<UserProfile>(`/api/users/${user.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onUserUpdated();
        onClose();
      } else {
        const payload: UserCreatePayload = {
          username: values.username,
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          role_id: values.role_id,
          phone: values.phone,
          department: values.department,
        };
        const response = await apiFetch<UserCreateResponse>("/api/users/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onClose();
        onUserCreated(response.temp_password);
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object"
      ) {
        const data = err.data as Record<string, unknown>;
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const msg = data[firstKey];
          setApiError(Array.isArray(msg) ? String(msg[0]) : String(msg));
        } else {
          setApiError("An error occurred. Please try again.");
        }
      } else {
        setApiError("An error occurred. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#2B3E50]">
            {isEdit ? "Edit User" : "Create User"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update user details and role assignment."
              : "Fill in the details to create a new user account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username — create only */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("username")}
                placeholder="e.g. john_doe"
                className={errors.username ? "border-red-400" : ""}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
              )}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("first_name")}
                placeholder="First"
                className={errors.first_name ? "border-red-400" : ""}
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register("last_name")}
                placeholder="Last"
                className={errors.last_name ? "border-red-400" : ""}
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              {...register("email")}
              type="email"
              placeholder="user@example.com"
              className={errors.email ? "border-red-400" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoleId ?? ""}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                setValue("role_id", val as number, { shouldValidate: true });
              }}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                errors.role_id ? "border-red-400" : "border-input"
              }`}
              disabled={rolesLoading}
            >
              <option value="">
                {rolesLoading ? "Loading roles..." : "Select a role"}
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {errors.role_id && (
              <p className="mt-1 text-xs text-red-500">{errors.role_id.message}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              Phone <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <Input {...register("phone")} placeholder="+233 20 000 0000" />
          </div>

          {/* Department (optional) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              Department <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <Input {...register("department")} placeholder="e.g. Operations" />
          </div>

          {/* API error */}
          {apiError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: "#1F7A8C" }}
              className="text-white hover:opacity-90"
            >
              {submitting
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                ? "Save Changes"
                : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
