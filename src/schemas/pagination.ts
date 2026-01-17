import { z } from "zod";
import {
  DEFAULT_LIMIT_PER_PAGE,
  MAX_LIMIT_PER_PAGE,
} from "@/constants/pagination";

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z
    .number()
    .min(1)
    .max(MAX_LIMIT_PER_PAGE)
    .default(DEFAULT_LIMIT_PER_PAGE),
});
