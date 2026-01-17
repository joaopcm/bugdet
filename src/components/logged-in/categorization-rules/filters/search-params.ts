import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useCategorizationRulesFilters() {
  const [filters, setFilters] = useQueryStates({
    query: parseAsString.withDefault(""),
    enabled: parseAsBoolean,
  });

  return {
    filters,
    setFilters,
  };
}
