'use client'

import { Input } from '@/components/ui/input'
import { SearchIcon } from 'lucide-react'
import { useDebounceCallback } from 'usehooks-ts'
import { useTransactionsFilters } from './search-params'

export function SearchFilter() {
  const { searchParams, setSearchParams } = useTransactionsFilters()

  const debouncedSetSearchParams = useDebounceCallback(
    (value: string) => setSearchParams({ query: value }),
    500,
  )

  return (
    <div className="relative xl:col-span-2">
      <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
      <Input
        placeholder="Search by merchant name..."
        className="pl-9"
        defaultValue={searchParams.query || ''}
        onChange={(e) => debouncedSetSearchParams(e.target.value)}
      />
    </div>
  )
}
