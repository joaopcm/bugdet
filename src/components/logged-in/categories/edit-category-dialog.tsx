'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useInvalidateCategories } from '@/hooks/use-categories'
import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'
import { CategoryForm, type CategoryFormValues } from './category-form'

interface EditCategoryDialogProps {
  categoryId: string
  name: string
}

export function EditCategoryDialog({
  categoryId,
  name,
}: EditCategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const invalidate = useInvalidateCategories()

  const { mutate: updateCategory, isPending: isUpdating } =
    trpc.categories.update.useMutation({
      onSuccess: (_, { name }) => {
        invalidate()
        toast.success(`You have updated the category "${name}".`)
        setIsOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  function onSubmit(values: CategoryFormValues) {
    updateCategory({ id: categoryId, name: values.name })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>
            Edit the category to group your transactions.
          </DialogDescription>
        </DialogHeader>
        <CategoryForm
          isLoading={isUpdating}
          onSubmit={onSubmit}
          initialValues={{ name }}
        />
      </DialogContent>
    </Dialog>
  )
}
