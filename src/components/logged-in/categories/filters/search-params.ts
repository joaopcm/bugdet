import { parseAsString, useQueryStates } from "nuqs";

export function useCategoriesFilters() {
  const [categoryFilters, setCategoryFilters] = useQueryStates({
    query: parseAsString.withDefault(""),
  });

  return {
    categoryFilters,
    setCategoryFilters,
  };
}
