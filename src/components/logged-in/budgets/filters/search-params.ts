import { format } from "date-fns";
import { parseAsString, useQueryStates } from "nuqs";

function getCurrentMonth() {
  return format(new Date(), "yyyy-MM");
}

export function useBudgetsFilters() {
  const [budgetFilters, setBudgetFilters] = useQueryStates({
    query: parseAsString.withDefault(""),
    month: parseAsString.withDefault(getCurrentMonth()),
  });

  return {
    budgetFilters,
    setBudgetFilters,
  };
}
