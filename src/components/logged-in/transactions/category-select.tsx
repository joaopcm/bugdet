'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCategories } from '@/hooks/use-categories'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { IconCheck, IconLoader2, IconPlus } from '@tabler/icons-react'
import { ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface CategorySelectProps {
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

export function CategorySelect({
  value,
  onChange,
  placeholder = 'Select a category',
  className,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const { data: categories, refetch: refetchCategories } = useCategories({
    ignoreFilters: true,
    ignorePagination: true,
  })

  const { mutate: createCategory, isPending: isCreatingCategory } =
    trpc.categories.create.useMutation({
      onSuccess: (newCategory) => {
        refetchCategories()
        toast.success(`Category "${newCategory.name}" created.`)
        onChange(newCategory.id)
        setNewCategoryName('')
        setIsCreating(false)
        setOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const selectedCategory = categories?.data.find((cat) => cat.id === value)

  function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      return
    }
    createCategory({ name: newCategoryName.trim() })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateCategory()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsCreating(false)
      setNewCategoryName('')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          {selectedCategory?.name ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {categories?.data.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onChange(category.id)
                    setOpen(false)
                  }}
                >
                  <IconCheck
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === category.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              {isCreating ? (
                <div className="flex items-center gap-2 p-2">
                  <Input
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isCreatingCategory}
                  >
                    {isCreatingCategory ? (
                      <IconLoader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              ) : (
                <CommandItem
                  onSelect={() => setIsCreating(true)}
                  className="cursor-pointer"
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create new category
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
