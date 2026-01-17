"use client";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

interface TwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TwoFactorDialog({
  open,
  onOpenChange,
  onSuccess,
}: TwoFactorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  async function handleVerifyTotp() {
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying code...");

    const response = await authClient.twoFactor.verifyTotp({
      code,
    });

    if (response.error) {
      toast.error(response.error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    toast.success("Verification successful", { id: toastId });
    onSuccess();
  }

  async function handleVerifyBackupCode() {
    if (!backupCode.trim()) {
      toast.error("Please enter a backup code");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying backup code...");

    const { error } = await authClient.twoFactor.verifyBackupCode({
      code: backupCode.trim(),
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    toast.success("Verification successful", { id: toastId });
    onSuccess();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCode("");
      setBackupCode("");
      setUseBackupCode(false);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Two-factor authentication</DialogTitle>
          <DialogDescription>
            {useBackupCode
              ? "Enter one of your backup codes to sign in."
              : "Enter the 6-digit code from your authenticator app."}
          </DialogDescription>
        </DialogHeader>

        {useBackupCode ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="backup-code">Backup code</Label>
              <Input
                disabled={isLoading}
                id="backup-code"
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="Enter backup code"
                value={backupCode}
              />
            </div>

            <DialogFooter>
              <Button
                disabled={isLoading}
                onClick={() => setUseBackupCode(false)}
                variant="ghost"
              >
                Use authenticator app instead
              </Button>
              <Button
                disabled={isLoading || !backupCode.trim()}
                onClick={handleVerifyBackupCode}
              >
                Verify
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <InputOTP
                disabled={isLoading}
                maxLength={6}
                onChange={setCode}
                onComplete={handleVerifyTotp}
                value={code}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <DialogFooter>
              <Button
                disabled={isLoading}
                onClick={() => setUseBackupCode(true)}
                variant="ghost"
              >
                Lost access to authenticator? Use backup code
              </Button>
              <Button
                disabled={isLoading || code.length !== 6}
                onClick={handleVerifyTotp}
              >
                Verify
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
