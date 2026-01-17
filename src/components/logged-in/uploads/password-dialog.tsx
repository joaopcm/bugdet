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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvalidateUploads } from "@/hooks/use-uploads";
import { trpc } from "@/lib/trpc/client";

interface PasswordDialogProps {
  uploadId: string;
  fileName: string;
  children: React.ReactNode;
}

export function PasswordDialog({
  uploadId,
  fileName,
  children,
}: PasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const invalidate = useInvalidateUploads();

  const { mutate: setUploadPassword, isPending } =
    trpc.uploads.setPassword.useMutation({
      onSuccess: () => {
        toast.success("Password submitted. Processing will resume shortly.");
        setOpen(false);
        setPassword("");
        invalidate();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }
    setUploadPassword({ uploadId, password });
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enter PDF password</DialogTitle>
            <DialogDescription>
              The file <strong>{fileName}</strong> is password-protected. Enter
              the password to process it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="off"
                id="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the PDF password"
                type="password"
                value={password}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={isPending || !password.trim()} type="submit">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
