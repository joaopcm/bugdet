'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Kbd, SHORTCUTS_VALUES } from '@/components/ui/kbd'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCategories } from '@/hooks/use-categories'
import {
  cn,
  formatCurrency,
  getCurrencyCode,
  getCurrencySymbol,
} from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconInfoCircle } from '@tabler/icons-react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useHotkeys } from 'react-hotkeys-hook'
import z from 'zod'

const transactionSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  date: z.string().date(),
  merchantName: z.string().min(1).max(255),
  amount: z.string().min(3),
  updateCategoryForSimilarTransactions: z.boolean().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  isLoading: boolean
  onSubmit: (values: z.infer<typeof transactionSchema>) => void
  initialValues?: z.infer<typeof transactionSchema>
  currencyCode?: string
  currencySymbol?: string
}

export function TransactionForm({
  isLoading,
  onSubmit,
  initialValues,
  currencyCode = getCurrencyCode(),
  currencySymbol = getCurrencySymbol(),
}: TransactionFormProps) {
  const { data: categories } = useCategories({
    ignoreFilters: true,
    ignorePagination: true,
  })
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const submitButtonRef = useRef<HTMLButtonElement>(null)

  useHotkeys(['esc'], () => {
    if (!closeButtonRef.current) {
      return
    }

    closeButtonRef.current.click()
  })

  useHotkeys(['meta+enter'], () => {
    if (isLoading || !submitButtonRef.current) {
      return
    }

    submitButtonRef.current.click()
  })

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialValues ?? {
      categoryId: null,
      date: format(new Date(), 'yyyy-MM-dd'),
      merchantName: '',
      amount: '',
    },
  })

  const hasChangedCategory = form.formState.dirtyFields.categoryId

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
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
                      variant="outline"
                      className={cn(
                        'pl-3 text-left font-normal active:scale-100',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(value) =>
                      value && field.onChange(format(value, 'yyyy-MM-dd'))
                    }
                    captionLayout="dropdown"
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
              <FormLabel htmlFor="categoryId">Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.data.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="updateCategoryForSimilarTransactions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox
                  id="updateCategoryForSimilarTransactions"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel
                htmlFor="updateCategoryForSimilarTransactions"
                className="flex items-center gap-1"
              >
                Update category for similar transactions
                <Tooltip>
                  <TooltipTrigger asChild>
                    <IconInfoCircle className="text-muted-foreground h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[240px]">
                      Updates all existing transactions from this merchant to
                      use the selected category, and saves the preference for
                      future imports.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </FormLabel>
            </FormItem>
          )}
        />

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
                  prefix={currencySymbol}
                  placeholder={formatCurrency(100, currencyCode)}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" ref={closeButtonRef}>
              Cancel <Kbd variant="outline">{SHORTCUTS_VALUES.ESC}</Kbd>
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading} ref={submitButtonRef}>
            Save
            <Kbd>
              {SHORTCUTS_VALUES.CMD} + {SHORTCUTS_VALUES.ENTER}
            </Kbd>
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
