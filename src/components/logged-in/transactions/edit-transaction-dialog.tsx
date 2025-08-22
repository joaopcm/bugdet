'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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
import type { transaction } from '@/db/schema'
import { useCategories } from '@/hooks/use-categories'
import { useTransactions } from '@/hooks/use-transactions'
import { trpc } from '@/lib/trpc/client'
import { cn, formatCurrency, getCurrencySymbol } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

type EditTransactionFormValues = z.infer<typeof editTransactionSchema>

const editTransactionSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  date: z.string().date(),
  merchantName: z.string().min(1).max(255),
  amount: z.number().max(Number.MAX_SAFE_INTEGER / 100),
})

interface EditTransactionDialogProps {
  children: React.ReactNode
  transaction: Pick<
    typeof transaction.$inferSelect,
    'id' | 'categoryId' | 'date' | 'merchantName' | 'amount' | 'currency'
  >
}

export function EditTransactionDialog({
  children,
  transaction,
}: EditTransactionDialogProps) {
  const { data: categories } = useCategories()
  const { refetch: refetchTransactions } = useTransactions()

  const form = useForm<EditTransactionFormValues>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      categoryId: transaction.categoryId,
      date: transaction.date,
      merchantName: transaction.merchantName,
      amount: transaction.amount / 100,
    },
  })

  const { mutate: updateTransaction, isPending: isUpdating } =
    trpc.transactions.update.useMutation({
      onSuccess: () => {
        refetchTransactions()
        toast.success(
          `You have updated the transaction "${formatCurrency(transaction.amount, transaction.currency)} - ${transaction.merchantName}".`,
        )
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  function onSubmit(values: EditTransactionFormValues) {
    updateTransaction({
      id: transaction.id,
      ...values,
    })
  }

  return (
    <Dialog>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit transaction</DialogTitle>
              <DialogDescription>
                Review and make changes to the transaction.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
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
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={field.onChange}
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
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
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
                        prefix={getCurrencySymbol(transaction.currency)}
                        placeholder={formatCurrency(
                          transaction.amount,
                          transaction.currency,
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdating}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  )
}
