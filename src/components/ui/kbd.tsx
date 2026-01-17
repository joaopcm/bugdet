import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn, getPlatformModifiers } from "@/lib/utils";

export const SHORTCUTS_VALUES = {
  CMD: getPlatformModifiers().CMD,
  ESC: "Esc",
  ENTER: "↩",
};

const kbdVariants = cva(
  "inline-flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 font-normal text-xs",
  {
    variants: {
      variant: {
        default:
          "border border-primary-border bg-primary text-primary-foreground shadow-primary",
        destructive:
          "border border-destructive-border bg-destructive text-white shadow-destructive-border dark:bg-destructive/60",
        outline:
          "border bg-card text-card-foreground shadow-xs dark:border-input dark:bg-input/30",
        secondary: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Kbd({
  variant,
  children,
  className,
  ...props
}: React.PropsWithChildren<VariantProps<typeof kbdVariants>> &
  React.HTMLAttributes<HTMLDivElement>) {
  const childrenString = children?.toString().toLowerCase() ?? "";

  return (
    <kbd
      {...props}
      className={cn(kbdVariants({ variant, className }), {
        uppercase: childrenString.length === 1,
      })}
    >
      {children}
    </kbd>
  );
}
