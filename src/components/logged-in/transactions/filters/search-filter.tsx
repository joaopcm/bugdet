'use client'

import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { usePagination } from '@/hooks/use-pagination'
import { SearchIcon } from 'lucide-react'
import { useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { useDebounceCallback } from 'usehooks-ts'
import { useTransactionsFilters } from './search-params'

const SEARCH_SHORTCUT = 'S'

export function SearchFilter() {
  const { transactionFilters, setTransactionFilters } = useTransactionsFilters()
  const { setPagination } = usePagination('transactions')
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSetSearchParams = useDebounceCallback((value: string) => {
    setTransactionFilters({ query: value })
    setPagination({ page: 1 })
  }, 500)

  useHotkeys(SEARCH_SHORTCUT, (e) => {
    e.preventDefault()
    inputRef.current?.focus()
  })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative xl:col-span-2">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
          <Input
            placeholder="Search by merchant name..."
            className="pl-9"
            defaultValue={transactionFilters.query || ''}
            onChange={(e) => debouncedSetSearchParams(e.target.value)}
            ref={inputRef}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Or press <Kbd variant="outline">{SEARCH_SHORTCUT}</Kbd> to search by
        merchant name
      </TooltipContent>
    </Tooltip>
  )
}
