import { MonthFilter } from './month-filter'
import { SearchFilter } from './search-filter'

export function BudgetsFilters() {
  return (
    <div className="flex items-center gap-2">
      <SearchFilter />
      <MonthFilter />
    </div>
  )
}
