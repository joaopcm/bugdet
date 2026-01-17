import { createLoader, parseAsString } from "nuqs/server";

export const resetPasswordSearchParams = {
  token: parseAsString.withDefault(""),
};

export const loadSearchParams = createLoader(resetPasswordSearchParams);
