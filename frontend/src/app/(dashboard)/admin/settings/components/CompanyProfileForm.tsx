"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { API_BASE_URL } from "@/lib/api";

const COMPANY_PROFILE_PATH = "/api/setup/company-profile/";

interface CompanyProfile {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  tin: string;
  registration_number: string;
  logo?: string | null;
  logo_url?: string | null;
}

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string(),
  address: z.string(),
  website: z.string(),
  tin: z.string(),
  registration_number: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function CompanyProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      tin: "",
      registration_number: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await apiFetch<CompanyProfile>(COMPANY_PROFILE_PATH);
        reset({
          name: profile.name ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          website: profile.website ?? "",
          tin: profile.tin ?? "",
          registration_number: profile.registration_number ?? "",
        });
        const logoSrc = profile.logo_url || profile.logo || null;
        setCurrentLogoUrl(logoSrc);
      } catch {
        setErrorMsg("Failed to load company profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [reset]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Logo must be a JPEG, PNG, or SVG file.");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg("Logo must be smaller than 2MB.");
      return;
    }

    setErrorMsg(null);
    setLogoFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      if (logoFile) {
        // Use raw fetch with FormData for multipart upload
        const formData = new FormData();
        formData.append("logo", logoFile);
        formData.append("name", values.name);
        formData.append("email", values.email);
        formData.append("phone", values.phone);
        formData.append("address", values.address);
        formData.append("website", values.website);
        formData.append("tin", values.tin);
        formData.append("registration_number", values.registration_number);

        const response = await fetch(
          `${API_BASE_URL}${COMPANY_PROFILE_PATH}`,
          {
            method: "PATCH",
            credentials: "include",
            body: formData,
            // No Content-Type header — browser sets multipart boundary automatically
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const msg =
            (data as Record<string, string[]>).detail ||
            Object.values(data as Record<string, string[]>)
              .flat()
              .join(", ") ||
            "Failed to save profile.";
          setErrorMsg(String(msg));
          return;
        }

        const saved = (await response.json()) as CompanyProfile;
        const newLogoUrl = saved.logo_url || saved.logo || null;
        setCurrentLogoUrl(newLogoUrl);
        setLogoPreview(null);
        setLogoFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        // JSON-only PATCH for text fields
        await apiFetch<CompanyProfile>(COMPANY_PROFILE_PATH, {
          method: "PATCH",
          body: JSON.stringify(values),
        });
      }

      setSuccessMsg("Company profile saved successfully.");
    } catch {
      setErrorMsg("Failed to save company profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        Loading profile…
      </div>
    );
  }

  const displayLogoUrl = logoPreview || currentLogoUrl;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl flex flex-col gap-6"
    >
      {/* Logo section */}
      <div className="flex items-start gap-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex-shrink-0">
          {displayLogoUrl ? (
            <img
              src={displayLogoUrl}
              alt="Company logo"
              className="h-20 w-20 rounded-lg object-contain border border-gray-200 bg-white p-1"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 text-xs text-center p-2">
              No logo
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Company Logo</p>
          <p className="text-xs text-gray-500">JPEG, PNG, or SVG. Max 2MB.</p>
          <label className="cursor-pointer">
            <span className="inline-block px-3 py-1.5 text-sm font-medium text-[#1F7A8C] border border-[#1F7A8C] rounded-md hover:bg-teal-50 transition-colors">
              {logoPreview ? "Change Logo" : "Upload Logo"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml"
              className="sr-only"
              onChange={handleLogoChange}
            />
          </label>
          {logoPreview && (
            <p className="text-xs text-green-600">New logo selected — save to apply.</p>
          )}
        </div>
      </div>

      {/* Company Name */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Company Name <span className="text-red-500">*</span>
        </label>
        <Input {...register("name")} placeholder="e.g. Fame Logistics Ltd" />
        {errors.name && (
          <p className="text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Email</label>
        <Input
          {...register("email")}
          type="email"
          placeholder="info@example.com"
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Phone</label>
        <Input {...register("phone")} placeholder="+233 20 000 0000" />
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Address</label>
        <textarea
          {...register("address")}
          rows={3}
          placeholder="Physical address"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </div>

      {/* Website */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Website</label>
        <Input
          {...register("website")}
          placeholder="https://www.example.com"
        />
      </div>

      {/* TIN and Registration in a row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">TIN</label>
          <Input {...register("tin")} placeholder="Tax Identification Number" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Registration Number
          </label>
          <Input
            {...register("registration_number")}
            placeholder="Company reg. number"
          />
        </div>
      </div>

      {/* Success / Error messages */}
      {successMsg && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: "#1F7A8C" }}
          className="text-white hover:opacity-90 min-w-[120px]"
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
