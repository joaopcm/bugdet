"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconInfoCircle } from "@tabler/icons-react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  cn,
  formatCurrency,
  getCurrencyCode,
  getCurrencySymbol,
} from "@/lib/utils";
import { CategorySelect } from "./category-select";

const transactionSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  date: z.string().date(),
  merchantName: z.string().min(1).max(255),
  amount: z.string().min(3),
  createCategorizationRule: z.boolean().optional(),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  isLoading: boolean;
  onSubmit: (values: z.infer<typeof transactionSchema>) => void;
  initialValues?: z.infer<typeof transactionSchema>;
  currencyCode?: string;
  currencySymbol?: string;
}

export function TransactionForm({
  isLoading,
  onSubmit,
  initialValues,
  currencyCode = getCurrencyCode(),
  currencySymbol = getCurrencySymbol(),
}: TransactionFormProps) {
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

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues ?? {
      categoryId: null,
      date: format(new Date(), "yyyy-MM-dd"),
      merchantName: "",
      amount: "",
    },
  });

  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });

  return (
    <Form {...form}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      className={cn(
                        "pl-3 text-left font-normal active:scale-100",
                        !field.value && "text-muted-foreground"
                      )}
                      variant="outline"
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    captionLayout="dropdown"
                    mode="single"
                    onSelect={(value) =>
                      value && field.onChange(format(value, "yyyy-MM-dd"))
                    }
                    selected={field.value ? new Date(field.value) : undefined}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <CategorySelect onChange={field.onChange} value={field.value} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedCategoryId && (
          <FormField
            control={form.control}
            name="createCategorizationRule"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    id="createCategorizationRule"
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel
                  className="flex items-center gap-1"
                  htmlFor="createCategorizationRule"
                >
                  Create categorization rule
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[240px]">
                        Creates a rule that assigns this category to all
                        existing and future transactions matching this merchant
                        name.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FormLabel>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="merchantName">Merchant name</FormLabel>
              <FormControl>
                <Input
                  id="merchantName"
                  placeholder="Amazon"
                  type="text"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="amount">Amount</FormLabel>
              <FormControl>
                <CurrencyInput
                  id="amount"
                  placeholder={formatCurrency(100, currencyCode)}
                  prefix={currencySymbol}
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
            Save
            <Kbd>
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
