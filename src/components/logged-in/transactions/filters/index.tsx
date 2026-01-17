import { MostExpensiveCategory } from "./badges/most-expensive-category";
import { MostExpensiveMerchant } from "./badges/most-expensive-merchant";
import { MostFrequentCategory } from "./badges/most-frequent-category";
import { MostFrequentMerchant } from "./badges/most-frequent-merchant";
import { ToReview } from "./badges/to-review";
import { CategoryFilter } from "./category-filter";
import { DateRangeFilter } from "./date-range-filter";
import { SearchFilter } from "./search-filter";
import { UploadFilter } from "./upload-filter";

export function TransactionsFilters() {
  return (
    <>
      <DateRangeFilter />
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-4">
        <SearchFilter />
        <CategoryFilter />
        <UploadFilter />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ToReview />
        <MostExpensiveMerchant />
        <MostExpensiveCategory />
        <MostFrequentCategory />
        <MostFrequentMerchant />
      </div>
    </>
  );
}
