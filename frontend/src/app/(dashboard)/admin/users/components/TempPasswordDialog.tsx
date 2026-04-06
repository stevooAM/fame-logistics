"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface TempPasswordDialogProps {
  open: boolean;
  tempPassword: string;
  onClose: () => void;
}

export function TempPasswordDialog({
  open,
  tempPassword,
  onClose,
}: TempPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = tempPassword;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#2B3E50]">User Created Successfully</DialogTitle>
          <DialogDescription>
            Temporary password for the new user.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <p className="mb-3 text-sm font-medium text-amber-800">
            This password will only be shown once. Please copy and share it with
            the user.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-base font-semibold text-[#2B3E50] shadow-sm border border-amber-200 select-all">
              {tempPassword}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: copied ? "#16a34a" : "#1F7A8C",
                color: "white",
              }}
              type="button"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            style={{ backgroundColor: "#1F7A8C" }}
            className="text-white hover:opacity-90"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
