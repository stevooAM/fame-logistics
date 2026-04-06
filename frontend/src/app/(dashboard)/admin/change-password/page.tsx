"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const schema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one digit"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChangePasswordPage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setApiError(null);

    try {
      await apiFetch("/api/users/change-password/", {
        method: "POST",
        body: JSON.stringify({
          current_password: values.current_password,
          new_password: values.new_password,
          confirm_password: values.confirm_password,
        }),
      });

      // Clear the force flag in-memory so the route guard doesn't redirect again
      updateUser({ is_force_password_change: false });
      router.push("/dashboard");
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: "#E6F3F5" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#1F7A8C"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#2B3E50]">Change Your Password</h1>
          <p className="mt-1 text-sm text-gray-500">
            You must change your temporary password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              Current Password
            </label>
            <div className="relative">
              <Input
                {...register("current_password")}
                type={showCurrent ? "text" : "password"}
                placeholder="Enter current password"
                className={errors.current_password ? "border-red-400 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.current_password && (
              <p className="mt-1 text-xs text-red-500">{errors.current_password.message}</p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              New Password
            </label>
            <div className="relative">
              <Input
                {...register("new_password")}
                type={showNew ? "text" : "password"}
                placeholder="Min 8 chars, uppercase, lowercase, digit"
                className={errors.new_password ? "border-red-400 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.new_password && (
              <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[#2B3E50]">
              Confirm New Password
            </label>
            <div className="relative">
              <Input
                {...register("confirm_password")}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your new password"
                className={errors.confirm_password ? "border-red-400 pr-10" : "pr-10"}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: "#1F7A8C" }}
          >
            {submitting ? "Changing password..." : "Change Password"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          For security, this is a one-time requirement for new accounts.
        </p>
      </div>
    </div>
  );
}
