"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log("Login attempt:", data);
    // Phase 2 will wire this to the auth API
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#2B3E50" }}
    >
      <div
        className="w-full max-w-md bg-white rounded-lg p-8"
        style={{ boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 6px 10px rgba(0,0,0,0.10)" }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
              style={{ color: "#333333" }}
            >
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              {...register("username")}
              style={errors.username ? { borderColor: "#ef4444" } : {}}
            />
            {errors.username && (
              <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
              style={{ color: "#333333" }}
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              style={errors.password ? { borderColor: "#ef4444" } : {}}
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full text-white font-semibold py-2"
            style={{
              backgroundColor: "#1F7A8C",
              outline: "none",
            }}
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#888" }}>
          Fame Logistics FMS &copy; 2026
        </p>
      </div>
    </div>
  );
}
