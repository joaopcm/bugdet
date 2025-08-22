'use client'

import { Button } from '@/components/ui/button'
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
import {} from '@/components/ui/popover'
import {} from '@/components/ui/select'
import type {} from '@/db/schema'
import { useCategories } from '@/hooks/use-categories'
import { trpc } from '@/lib/trpc/client'
import {} from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
})

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>

interface CreateCategoryDialogProps {
  children: React.ReactNode
}

export function CreateCategoryDialog({ children }: CreateCategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { refetch: refetchCategories } = useCategories()

  const form = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
    },
  })

  const { mutate: createCategory, isPending: isCreating } =
    trpc.categories.create.useMutation({
      onSuccess: (_, { name }) => {
        refetchCategories()
        toast.success(`You have created the category "${name}".`)
        setIsOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  function onSubmit(values: CreateCategoryFormValues) {
    createCategory(values)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create category</DialogTitle>
              <DialogDescription>
                Create a new category to group your transactions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 mt-6">
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
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isCreating}>
                  Create
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
