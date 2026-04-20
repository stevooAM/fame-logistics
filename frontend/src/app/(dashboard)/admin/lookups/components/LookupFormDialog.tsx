"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { LookupConfig, LookupEntry } from "@/types/lookup";

interface LookupFormDialogProps {
  config: LookupConfig;
  entry: LookupEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

const baseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  sort_order: z.coerce.number().default(0),
});

type FormValues = z.infer<typeof baseSchema> & Record<string, unknown>;

export function LookupFormDialog({
  config,
  entry,
  onClose,
  onSaved,
}: LookupFormDialogProps) {
  const isEdit = entry !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      name: "",
      code: "",
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (entry) {
      reset({
        name: entry.name,
        code: entry.code ?? "",
        sort_order: entry.sort_order,
        ...Object.fromEntries(
          (config.extraFields ?? []).map((f) => [
            f.name,
            (entry as unknown as Record<string, unknown>)[f.name] ?? (f.type === "checkbox" ? false : f.type === "number" ? 0 : ""),
          ])
        ),
      });
    } else {
      reset({
        name: "",
        code: "",
        sort_order: 0,
        ...Object.fromEntries(
          (config.extraFields ?? []).map((f) => [
            f.name,
            f.type === "checkbox" ? false : f.type === "number" ? 0 : "",
          ])
        ),
      });
    }
  }, [entry, config, reset]);

  async function onSubmit(values: FormValues) {
    const payload: Record<string, unknown> = {
      name: values.name,
      code: values.code ? String(values.code).toUpperCase() : null,
      sort_order: values.sort_order,
    };

    for (const field of config.extraFields ?? []) {
      payload[field.name] = values[field.name];
    }

    if (isEdit) {
      await apiFetch(`${config.apiPath}${entry!.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch(config.apiPath, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit" : "Add"} {config.label} Entry
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <Input {...register("name")} placeholder="Entry name" />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Code */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Code</label>
            <Input
              {...register("code")}
              placeholder="Optional code (auto-uppercased)"
            />
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Sort Order</label>
            <Input
              {...register("sort_order")}
              type="number"
              placeholder="0"
            />
          </div>

          {/* Extra fields from config */}
          {(config.extraFields ?? []).map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              {field.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    {...register(field.name)}
                    className="h-4 w-4 rounded border-gray-300 text-[#1F7A8C]"
                  />
                  {field.label}
                </label>
              ) : (
                <>
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <Input
                    {...register(field.name)}
                    type={field.type}
                    placeholder={field.label}
                    step={field.type === "number" ? "0.0001" : undefined}
                  />
                </>
              )}
            </div>
          ))}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: "#1F7A8C" }}
              className="text-white hover:opacity-90"
            >
              {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
