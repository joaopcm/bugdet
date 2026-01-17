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
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

interface DisableTwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisableTwoFactorDialog({
  open,
  onOpenChange,
}: DisableTwoFactorDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  function reset() {
    setPassword("");
    setIsLoading(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  }

  async function handleDisable() {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Disabling two-factor authentication...");

    const { error } = await authClient.twoFactor.disable({
      password,
    });

    if (error) {
      toast.error(error.message, { id: toastId });
      setIsLoading(false);
      return;
    }

    toast.success("Two-factor authentication disabled", { id: toastId });
    handleOpenChange(false);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disable two-factor authentication</DialogTitle>
          <DialogDescription>
            Enter your password to disable two-factor authentication. This will
            make your account less secure.
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
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={() => handleOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={isLoading || !password}
            onClick={handleDisable}
            variant="destructive"
          >
            Disable 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
