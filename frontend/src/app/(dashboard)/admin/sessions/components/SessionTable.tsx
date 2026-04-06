"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import type { ActiveSession } from "@/types/session";

interface SessionTableProps {
  sessions: ActiveSession[];
  onRefresh: () => void;
}

function formatDateTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function getRoleBadgeVariant(
  role: string
): "default" | "secondary" | "outline" {
  const lower = role.toLowerCase();
  if (lower === "admin") return "default";
  if (lower === "finance") return "secondary";
  return "outline";
}

export function SessionTable({ sessions, onRefresh }: SessionTableProps) {
  const [targetSession, setTargetSession] = useState<ActiveSession | null>(
    null
  );
  const [isTerminating, setIsTerminating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openConfirmDialog(session: ActiveSession) {
    setTargetSession(session);
    setError(null);
  }

  function closeDialog() {
    if (!isTerminating) {
      setTargetSession(null);
      setError(null);
    }
  }

  async function handleTerminate() {
    if (!targetSession) return;
    setIsTerminating(true);
    setError(null);

    try {
      await apiFetch(`/api/sessions/${targetSession.token_id}/terminate/`, {
        method: "POST",
      });
      setTargetSession(null);
      onRefresh();
    } catch {
      setError("Failed to terminate session. Please try again.");
    } finally {
      setIsTerminating(false);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        No active sessions
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Login Time</TableHead>
            <TableHead>Expires At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.token_id}>
              <TableCell>
                <div>
                  <p className="font-medium text-gray-900">{session.username}</p>
                  {session.full_name && (
                    <p className="text-xs text-gray-500">{session.full_name}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(session.role)}>
                  {session.role || "Unknown"}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-600 font-mono text-sm">
                {session.ip_address ?? "—"}
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {formatDateTime(session.created_at)}
              </TableCell>
              <TableCell className="text-gray-600 text-sm">
                {formatDateTime(session.expires_at)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openConfirmDialog(session)}
                >
                  Terminate
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!targetSession} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate all sessions for{" "}
              <span className="font-semibold">{targetSession?.username}</span>?
              This will immediately log them out of all devices.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-600 px-1">{error}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={isTerminating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminate}
              disabled={isTerminating}
            >
              {isTerminating ? "Terminating..." : "Terminate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
