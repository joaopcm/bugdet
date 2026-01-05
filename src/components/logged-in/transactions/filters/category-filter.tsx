'use client'

import { Kbd } from '@/components/ui/kbd'
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
import { usePagination } from '@/hooks/use-pagination'
import { useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useTransactionsFilters } from './search-params'

const CATEGORY_SHORTCUT = 'C'

/**
 * Renders a category selection control with a tooltip and a keyboard shortcut to open the dropdown.
 *
 * Selecting a category updates the transaction filters and resets pagination to page 1. The dropdown includes an "All categories" option and one entry per available category.
 *
 * @returns The Select UI for choosing a transaction category.
 */
export function CategoryFilter() {
  const { data: categories } = useCategories({
    ignoreFilters: true,
    ignorePagination: true,
  })
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')
  const [isOpen, setIsOpen] = useState(false)

  useHotkeys(CATEGORY_SHORTCUT, (e) => {
    e.preventDefault()
    setIsOpen(!isOpen)
  })

  return (
    <Select
      onValueChange={(value) => {
        setTransactionFilters({ category: value })
        setPagination({ page: 1 })
      }}
      value={transactionFilters.category || undefined}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Or press <Kbd variant="outline">{CATEGORY_SHORTCUT}</Kbd> to filter by
          a specific category
        </TooltipContent>
      </Tooltip>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories?.data.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}