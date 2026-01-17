"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import z from "zod";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Kbd, SHORTCUTS_VALUES } from "@/components/ui/kbd";

const categorySchema = z.object({
  name: z.string().min(1).max(255),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  isLoading: boolean;
  onSubmit: (values: CategoryFormValues) => void;
  initialValues?: CategoryFormValues;
}

export function CategoryForm({
  isLoading,
  onSubmit,
  initialValues,
}: CategoryFormProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  useHotkeys(["esc"], () => {
    if (!closeButtonRef.current) {
      return;
    }

    closeButtonRef.current.click();
  });

  useHotkeys(["mod+enter"], () => {
    if (isLoading || !submitButtonRef.current) {
      return;
    }

    submitButtonRef.current.click();
  });

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialValues ?? {
      name: "",
    },
  });

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name">Name</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  placeholder="Groceries"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button ref={closeButtonRef} variant="outline">
              Cancel <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
            </Button>
          </DialogClose>
          <Button disabled={isLoading} ref={submitButtonRef} type="submit">
            Save{" "}
            <Kbd>
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
