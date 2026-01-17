import { parseAsString, useQueryStates } from "nuqs";

export function useUploadsFilters() {
  const [uploadsFilters, setUploadsFilters] = useQueryStates({
    query: parseAsString.withDefault(""),
  });

  return {
    uploadsFilters,
    setUploadsFilters,
  };
}
