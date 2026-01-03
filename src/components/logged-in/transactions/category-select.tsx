'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
  const [search, setSearch] = useState('')

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
        setSearch('')
        setOpen(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const selectedCategory = categories?.data.find((cat) => cat.id === value)

  const filteredCategories =
    categories?.data.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? []

  const exactMatch = categories?.data.some(
    (cat) => cat.name.toLowerCase() === search.toLowerCase(),
  )

  const showCreateOption = search.trim() && !exactMatch

  function handleCreateCategory() {
    if (!search.trim()) return
    createCategory({ name: search.trim() })
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
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-0 p-0"
        align="start"
      >
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            placeholder="Search or create category..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={() => {
                    onChange(category.id)
                    setSearch('')
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
              {showCreateOption && (
                <CommandItem
                  onSelect={handleCreateCategory}
                  disabled={isCreatingCategory}
                  className="cursor-pointer"
                >
                  {isCreatingCategory ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconPlus className="mr-2 h-4 w-4" />
                  )}
                  Create "{search.trim()}"
                </CommandItem>
              )}
              {filteredCategories.length === 0 && !showCreateOption && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No category found.
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
