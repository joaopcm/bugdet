import { trpc } from "@/lib/trpc/client";

export function useMostFrequentCategory() {
  return trpc.transactions.getMostFrequentCategory.useQuery();
}
