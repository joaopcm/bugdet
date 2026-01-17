"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Kbd, SHORTCUTS_VALUES } from "../ui/kbd";

interface DoubleConfirmationAlertDialogProps {
  children: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  body?: React.ReactNode;
}

export function DoubleConfirmationAlertDialog({
  children,
  title,
  description,
  onConfirm,
  body,
}: DoubleConfirmationAlertDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(["esc"], () => {
    setIsOpen(false);
  });

  useHotkeys(["mod+enter"], () => {
    if (!isOpen) {
      return;
    }

    onConfirm();
    setIsOpen(false);
  });

  return (
    <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {body}

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancel <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Continue{" "}
            <Kbd variant="destructive">
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
