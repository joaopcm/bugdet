import { MonthFilter } from './month-filter'
import { SearchFilter } from './search-filter'

export function BudgetsFilters() {
  return (
    // <div className="grid grid-cols-1 xl:grid-cols-5 gap-2">
    <div className="flex items-center gap-2">
      <SearchFilter />
      <MonthFilter />
    </div>
  )
}
