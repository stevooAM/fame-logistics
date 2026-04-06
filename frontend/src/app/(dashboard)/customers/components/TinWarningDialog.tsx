"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TinWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onProceed: () => void;
  existingCustomerName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TinWarningDialog({
  open,
  onClose,
  onProceed,
  existingCustomerName,
}: TinWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-w-md p-0 border-0 overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Amber top rail */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(to right, #F89C1C, #fbbf24)" }} />

        <div className="px-6 pt-5 pb-4">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {/* Amber icon circle */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F89C1C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-[#2B3E50]">
                  Duplicate TIN Detected
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-gray-600">
                  A customer with this TIN already exists:{" "}
                  <span className="font-medium text-[#2B3E50]">{existingCustomerName}</span>.
                  Proceed anyway?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onProceed}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: "#F89C1C" }}
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
