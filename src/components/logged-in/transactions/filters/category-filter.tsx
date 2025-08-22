'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/use-categories'
import { useTransactionsFilters } from './search-params'

export function CategoryFilter() {
  const { data: categories } = useCategories()
  const { searchParams, setSearchParams } = useTransactionsFilters()

  return (
    <Select
      onValueChange={(value) => setSearchParams({ category: value })}
      defaultValue={searchParams.category || undefined}
    >
      <SelectTrigger id="categoryId" className="w-full">
        <SelectValue placeholder="Select a category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All categories</SelectItem>
        {categories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
