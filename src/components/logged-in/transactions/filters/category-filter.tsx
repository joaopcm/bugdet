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

export function CategoryFilter() {
  const { data: categories } = useCategories()
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination()
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
