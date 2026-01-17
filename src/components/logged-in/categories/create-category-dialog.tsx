"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useInvalidateCategories } from "@/hooks/use-categories";
import { trpc } from "@/lib/trpc/client";
import { CategoryForm, type CategoryFormValues } from "./category-form";

const NEW_CATEGORY_SHORTCUT = "N";

export function CreateCategoryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const invalidate = useInvalidateCategories();

  const { mutate: createCategory, isPending: isCreating } =
    trpc.categories.create.useMutation({
      onSuccess: (_, { name }) => {
        invalidate();
        toast.success(`You have created the category "${name}".`);
        setIsOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  useHotkeys(NEW_CATEGORY_SHORTCUT, (e) => {
    e.preventDefault();
    setIsOpen(true);
  });

  function onSubmit(values: CategoryFormValues) {
    createCategory(values);
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button>
          New category
          <Kbd className="-mr-2" variant="default">
            {NEW_CATEGORY_SHORTCUT}
          </Kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create category</DialogTitle>
          <DialogDescription>
            Create a new category to group your transactions.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm isLoading={isCreating} onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
}
