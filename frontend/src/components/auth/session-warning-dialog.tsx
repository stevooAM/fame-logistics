"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SessionWarningDialogProps {
  open: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

/**
 * Modal dialog that warns the user their session is about to expire.
 *
 * Shown when the idle timeout hook crosses the warning threshold (2 minutes
 * before the full 30-minute idle timeout fires).
 *
 * - "Stay Logged In" refreshes the token and resets the idle timer.
 * - "Log Out" immediately signs the user out.
 * - If the dialog is ignored, the idle timeout fires and the user is silently
 *   redirected to /login by the onTimeout handler in the parent.
 */
export function SessionWarningDialog({
  open,
  onStayLoggedIn,
  onLogout,
}: SessionWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        // Prevent closing by clicking the backdrop or pressing Escape —
        // the user must make an explicit choice.
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Session Expiring</DialogTitle>
          <DialogDescription>
            Your session will expire in 2 minutes due to inactivity.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onLogout}
          >
            Log Out
          </Button>

          <Button
            onClick={onStayLoggedIn}
            style={{ backgroundColor: "#1F7A8C" }}
            className="text-white hover:opacity-90"
          >
            Stay Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
