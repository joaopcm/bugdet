"use client";

import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

interface BackupCodesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "password" | "codes";

export function BackupCodesDialog({
  open,
  onOpenChange,
}: BackupCodesDialogProps) {
  const [step, setStep] = useState<Step>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  function reset() {
    setStep("password");
    setPassword("");
    setBackupCodes([]);
    setCopiedCodes(false);
    setIsLoading(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  async function handleGetBackupCodes() {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying password...");

    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password,
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    if (data?.backupCodes) {
      setBackupCodes(data.backupCodes);
      toast.success("Password verified", { id: toastId });
      setStep("codes");
    }

    setIsLoading(false);
  }

  async function handleRegenerateCodes() {
    setIsLoading(true);
    const toastId = toast.loading("Regenerating backup codes...");

    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password,
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    if (data?.backupCodes) {
      setBackupCodes(data.backupCodes);
      toast.success(
        "Backup codes regenerated. Previous codes are now invalid.",
        {
          id: toastId,
        }
      );
    }

    setIsLoading(false);
  }

  async function handleCopyBackupCodes() {
    const codesText = backupCodes.join("\n");
    await navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success("Backup codes copied to clipboard");
    setTimeout(() => setCopiedCodes(false), 2000);
  }

  function handleDownloadBackupCodes() {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bugdet-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup codes downloaded");
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        {step === "password" && (
          <>
            <DialogHeader>
              <DialogTitle>View backup codes</DialogTitle>
              <DialogDescription>
                Enter your password to view your backup codes.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  disabled={isLoading}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && password && !isLoading) {
                      e.preventDefault();
                      handleGetBackupCodes();
                    }
                  }}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={isLoading || !password}
                onClick={handleGetBackupCodes}
                type="button"
              >
                View codes
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "codes" && (
          <>
            <DialogHeader>
              <DialogTitle>Backup codes</DialogTitle>
              <DialogDescription>
                Each code can only be used once. Used codes will not appear
                here.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                {backupCodes.map((code, _index) => (
                  <code className="font-mono text-sm" key={code}>
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleCopyBackupCodes}
                  type="button"
                  variant="outline"
                >
                  {copiedCodes ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                  {copiedCodes ? "Copied!" : "Copy"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleDownloadBackupCodes}
                  type="button"
                  variant="outline"
                >
                  <IconDownload className="size-4" />
                  Download
                </Button>
              </div>
              <Button
                disabled={isLoading}
                onClick={handleRegenerateCodes}
                type="button"
                variant="outline"
              >
                <IconRefresh className="size-4" />
                Regenerate codes
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)} type="button">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
