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
import { useCategorizationRulesFilters } from './search-params'

const SEARCH_SHORTCUT = 'S'

/**
 * Renders a search input used to filter categorization rules by name.
 *
 * The input updates the active filters' `query` and resets pagination to page 1 after a 500ms debounce.
 * Pressing the configured shortcut focuses the input. A tooltip shows the shortcut hint.
 *
 * @returns The JSX element for the search filter control.
 */
export function SearchFilter() {
  const { filters, setFilters } = useCategorizationRulesFilters()
  const { setPagination } = usePagination('categorization-rules')
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSetSearchParams = useDebounceCallback((value: string) => {
    setFilters({ query: value })
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
            placeholder="Search by rule name..."
            className="pl-9"
            defaultValue={filters.query || ''}
            onChange={(e) => debouncedSetSearchParams(e.target.value)}
            ref={inputRef}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Or press <Kbd variant="outline">{SEARCH_SHORTCUT}</Kbd> to search by
        rule name
      </TooltipContent>
    </Tooltip>
  )
}