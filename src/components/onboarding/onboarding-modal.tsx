"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OnboardingForm } from "./onboarding-form";

interface OnboardingModalProps {
  open: boolean;
}

export function OnboardingModal({ open }: OnboardingModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-xl [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Let's personalize your experience</DialogTitle>
          <DialogDescription>
            Answer a few quick questions so we can tailor Bugdet to your needs.
          </DialogDescription>
        </DialogHeader>
        <OnboardingForm />
      </DialogContent>
    </Dialog>
  );
}
