"use client";

import { IconCheck, IconCopy, IconDownload } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
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

const TOTP_SECRET_REGEX = /secret=([A-Z2-7]+)/;

interface EnableTwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "password" | "qrcode" | "verify" | "backup-codes";

export function EnableTwoFactorDialog({
  open,
  onOpenChange,
}: EnableTwoFactorDialogProps) {
  const [step, setStep] = useState<Step>("password");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  function reset() {
    setStep("password");
    setPassword("");
    setTotpUri("");
    setSecret("");
    setVerifyCode("");
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

  async function handleEnableTwoFactor() {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying password...");

    const { data, error } = await authClient.twoFactor.enable({
      password,
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    if (data?.totpURI) {
      setTotpUri(data.totpURI);
      // Extract secret from URI for manual entry
      const secretMatch = data.totpURI.match(TOTP_SECRET_REGEX);
      if (secretMatch) {
        setSecret(secretMatch[1]);
      }
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
      }
      toast.success("Password verified", { id: toastId });
      setStep("qrcode");
    }

    setIsLoading(false);
  }

  async function handleVerifyCode() {
    if (verifyCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying code...");

    const { error } = await authClient.twoFactor.verifyTotp({
      code: verifyCode,
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    toast.success("Two-factor authentication enabled", { id: toastId });
    setStep("backup-codes");
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

  function handleFinish() {
    handleOpenChange(false);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        {step === "password" && (
          <>
            <DialogHeader>
              <DialogTitle>Enable two-factor authentication</DialogTitle>
              <DialogDescription>
                Enter your password to continue setting up two-factor
                authentication.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  disabled={isLoading}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={isLoading || !password}
                onClick={handleEnableTwoFactor}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "qrcode" && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR code</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app (e.g. Google
                Authenticator, Authy).
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-4">
                <QRCodeSVG size={200} value={totpUri} />
              </div>
              {secret && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-muted-foreground text-sm">
                    Can&apos;t scan? Enter this code manually:
                  </span>
                  <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
                    {secret}
                  </code>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setStep("verify")}>
                I&apos;ve scanned the code
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Verify setup</DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app to verify the
                setup.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                disabled={isLoading}
                maxLength={6}
                onChange={setVerifyCode}
                onComplete={handleVerifyCode}
                value={verifyCode}
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
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button onClick={() => setStep("qrcode")} variant="outline">
                Back
              </Button>
              <Button
                disabled={isLoading || verifyCode.length !== 6}
                onClick={handleVerifyCode}
              >
                Verify
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "backup-codes" && (
          <>
            <DialogHeader>
              <DialogTitle>Save your backup codes</DialogTitle>
              <DialogDescription>
                Store these backup codes in a safe place. Each code can only be
                used once. You can use them to access your account if you lose
                your authenticator device.
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
                  variant="outline"
                >
                  <IconDownload className="size-4" />
                  Download
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleFinish}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
