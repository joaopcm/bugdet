'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { IconLoader2, IconPlus } from '@tabler/icons-react'
import { ChevronsUpDown, XIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

interface CategoryMultiSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function CategoryMultiSelect({
  value,
  onChange,
  placeholder = 'Select categories',
  className,
}: CategoryMultiSelectProps) {
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
        toast.success(`Category "${newCategory.name}" created`)
        onChange([...value, newCategory.id])
        setSearch('')
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const selectedCategories = useMemo(
    () => categories?.data.filter((cat) => value.includes(cat.id)) ?? [],
    [categories?.data, value],
  )

  const filteredCategories = useMemo(
    () =>
      categories?.data.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [categories?.data, search],
  )

  const exactMatch = useMemo(
    () =>
      categories?.data.some(
        (cat) => cat.name.toLowerCase() === search.toLowerCase(),
      ),
    [categories?.data, search],
  )

  const showCreateOption = search.trim() && !exactMatch

  const handleCreateCategory = useCallback(() => {
    if (!search.trim()) return
    createCategory({ name: search.trim() })
  }, [search, createCategory])

  const handleToggle = useCallback(
    (categoryId: string) => {
      if (value.includes(categoryId)) {
        onChange(value.filter((id) => id !== categoryId))
      } else {
        onChange([...value, categoryId])
      }
    },
    [value, onChange],
  )

  const handleRemove = useCallback(
    (categoryId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(value.filter((id) => id !== categoryId))
    },
    [value, onChange],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal min-h-10 h-auto hover:bg-card',
            className,
          )}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedCategories.length > 0 ? (
              selectedCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="mr-1 py-0 pr-0"
                >
                  {category.name}
                  <span
                    // biome-ignore lint/a11y/useSemanticElements: We cannot have nested buttons here
                    role="button"
                    tabIndex={0}
                    className="rounded-sm outline-none hover:bg-secondary-foreground/20 cursor-pointer"
                    onClick={(e) => handleRemove(category.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleRemove(
                          category.id,
                          e as unknown as React.MouseEvent,
                        )
                      }
                    }}
                  >
                    <XIcon className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-0 p-0"
        align="start"
      >
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            placeholder="Search or create category..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList onWheel={(e) => e.stopPropagation()}>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={() => handleToggle(category.id)}
                >
                  <Checkbox
                    checked={value.includes(category.id)}
                    className="mr-2"
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
