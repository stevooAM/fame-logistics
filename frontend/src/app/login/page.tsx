"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import { ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Error message helper
// ---------------------------------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Invalid credentials. Please try again.";
    if (error.status === 429)
      return "Too many login attempts. Please try again later.";
    if (error.status >= 500)
      return "Server error. Please try again in a moment.";
  }
  if (error instanceof TypeError) {
    // Network error (fetch failed)
    return "Unable to connect to server. Please try again.";
  }
  return "An unexpected error occurred. Please try again.";
}

// ---------------------------------------------------------------------------
// Left panel — branded freight visual
// ---------------------------------------------------------------------------

function BrandPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
      style={{ backgroundColor: "#2B3E50" }}
    >
      {/* Subtle freight-themed grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, #1F7A8C 39px, #1F7A8C 40px), " +
            "repeating-linear-gradient(90deg, transparent, transparent 39px, #1F7A8C 39px, #1F7A8C 40px)",
        }}
      />

      {/* Brand mark */}
      <div className="relative z-10">
        <div
          className="text-3xl font-bold tracking-wide mb-2"
          style={{ color: "#1F7A8C" }}
        >
          FAME LOGISTICS
        </div>
        <div
          className="text-sm font-medium"
          style={{
            color: "#F89C1C",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Freight Management System
        </div>
      </div>

      {/* Central visual — abstract freight container stack */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-8 gap-3">
        {[
          { color: "#1F7A8C", width: "80%", label: "FAME-0042" },
          { color: "#2a5f6e", width: "70%", label: "FAME-0031" },
          { color: "#1a4a5a", width: "60%", label: "FAME-0028" },
        ].map((bar) => (
          <div
            key={bar.label}
            className="rounded flex items-center justify-end pr-3 py-2"
            style={{
              width: bar.width,
              backgroundColor: bar.color,
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          >
            <span
              className="text-xs font-mono tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {bar.label}
            </span>
          </div>
        ))}
        <div
          className="mt-4 text-xs tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Managing freight end-to-end
        </div>
      </div>

      {/* Footer */}
      <div
        className="relative z-10 text-xs"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Fame Logistics FMS &copy; 2026
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login(data.username, data.password, data.rememberMe);
      router.push("/");
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: branded panel */}
      <BrandPanel />

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          {/* Mobile-only brand header */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: "#1F7A8C" }}
            >
              FAME LOGISTICS
            </div>
            <div
              className="text-sm"
              style={{
                color: "#333333",
                borderBottom: "2px solid #F89C1C",
                paddingBottom: "4px",
                display: "inline-block",
              }}
            >
              Freight Management System
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-2xl font-semibold mb-1"
              style={{ color: "#2B3E50" }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Sign in to your account to continue
            </p>
          </div>

          {/* Server error alert */}
          {serverError && (
            <div
              className="mb-4 px-4 py-3 rounded text-sm"
              style={{
                backgroundColor: "#fef2f2",
                borderLeft: "4px solid #ef4444",
                color: "#b91c1c",
              }}
              role="alert"
            >
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-1"
                style={{ color: "#374151" }}
              >
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                disabled={isSubmitting}
                {...register("username")}
                style={errors.username ? { borderColor: "#ef4444" } : {}}
              />
              {errors.username && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
                style={{ color: "#374151" }}
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                {...register("password")}
                style={errors.password ? { borderColor: "#ef4444" } : {}}
              />
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded"
                disabled={isSubmitting}
                style={{ accentColor: "#1F7A8C" }}
                {...register("rememberMe")}
              />
              <label
                htmlFor="rememberMe"
                className="text-sm select-none"
                style={{ color: "#374151" }}
              >
                Remember me on this device
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-white font-semibold py-2 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#1F7A8C" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm hover:underline"
              style={{ color: "#1F7A8C" }}
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
