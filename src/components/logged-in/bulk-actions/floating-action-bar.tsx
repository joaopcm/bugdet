"use client";

import { IconBackspace } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Kbd, SHORTCUTS_VALUES } from "@/components/ui/kbd";
import { cn, pluralize } from "@/lib/utils";

interface FloatingActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  isDeleting?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function FloatingActionBar({
  selectedCount,
  onDelete,
  isDeleting = false,
  children,
  className,
}: FloatingActionBarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isShown, setIsShown] = useState(false);

  // Handle enter/exit animations
  useEffect(() => {
    if (selectedCount > 0) {
      // Mount first, then animate in after a frame
      setIsVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsShown(true);
        });
      });
    } else if (isVisible) {
      // Animate out first, then unmount
      setIsShown(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedCount, isVisible]);

  useHotkeys(
    ["backspace"],
    () => {
      if (selectedCount > 0 && !isDialogOpen) {
        setIsDialogOpen(true);
      }
    },
    { enabled: selectedCount > 0 }
  );

  useHotkeys(["esc"], () => {
    setIsDialogOpen(false);
  });

  useHotkeys(["mod+enter"], () => {
    if (!isDialogOpen) {
      return;
    }
    onDelete();
    setIsDialogOpen(false);
  });

  if (!isVisible) {
    return null;
  }

  const displayCount = selectedCount > 0 ? selectedCount : 0;
  const itemLabel = pluralize(displayCount, "item");

  const content = (
    <>
      {/* Radial blur background */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 h-64 transition-opacity duration-150",
          isShown ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 100%, rgba(0,0,0,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        className={cn(
          "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-transform duration-150",
          isShown ? "translate-y-0" : "translate-y-20",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 shadow-lg">
          <div className="flex items-center gap-4">
            <span className="font-medium text-sm">
              {displayCount} {itemLabel} selected
            </span>

            {children}
          </div>

          <AlertDialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button disabled={isDeleting} size="sm" variant="destructive">
                Delete all{" "}
                <Kbd variant="destructive">
                  <IconBackspace />
                </Kbd>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete {displayCount} {itemLabel}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Are you sure you want to delete{" "}
                  {displayCount === 1 ? "this" : "these"} {itemLabel}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  Cancel <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={onDelete}
                  variant="destructive"
                >
                  Delete{" "}
                  <Kbd variant="destructive">
                    {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
                  </Kbd>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(content, document.body);
}
