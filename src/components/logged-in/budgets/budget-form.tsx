"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import z from "zod";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrencySymbol } from "@/lib/utils";
import { CategoryMultiSelect } from "./category-multi-select";

const budgetSchema = z.object({
  name: z.string().min(1).max(255),
  targetAmount: z.string().min(1),
  currency: z.string().min(3).max(3),
  categoryIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one category"),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  isLoading: boolean;
  onSubmit: (values: BudgetFormValues) => void;
  initialValues?: BudgetFormValues;
  currencies: string[];
}

export function BudgetForm({
  isLoading,
  onSubmit,
  initialValues,
  currencies,
}: BudgetFormProps) {
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

  const defaultCurrency = initialValues?.currency ?? currencies[0] ?? "USD";

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: initialValues ?? {
      name: "",
      targetAmount: "",
      currency: defaultCurrency,
      categoryIds: [],
    },
  });

  useEffect(() => {
    if (!initialValues && currencies.length > 0) {
      const current = form.getValues("currency");
      if (!(current && currencies.includes(current))) {
        form.setValue("currency", currencies[0]);
      }
    }
  }, [currencies, form, initialValues]);

  const selectedCurrency = useWatch({
    control: form.control,
    name: "currency",
  });
  const currencySymbol = getCurrencySymbol(selectedCurrency);

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
                  placeholder="Monthly groceries"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem className="col-span-3">
                <FormLabel htmlFor="targetAmount">Target amount</FormLabel>
                <FormControl>
                  <CurrencyInput
                    id="targetAmount"
                    onValueChange={(values) => field.onChange(values.value)}
                    placeholder="0.00"
                    prefix={`${currencySymbol} `}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="currency">Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full" id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categories</FormLabel>
              <FormControl>
                <CategoryMultiSelect
                  onChange={field.onChange}
                  placeholder="Select categories to track"
                  value={field.value}
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
