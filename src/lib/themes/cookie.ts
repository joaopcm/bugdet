import type { ColorMode } from "./types";

export const THEME_COOKIE = "bugdet.theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const DEFAULT_PRESET = "matsu";
export const DEFAULT_MODE: ColorMode = "system";

export interface ThemeCookieValue {
  preset: string;
  mode: ColorMode;
}

const VALID_MODES: ReadonlySet<ColorMode> = new Set([
  "light",
  "dark",
  "system",
]);

export function parseThemeCookie(raw: string | undefined): ThemeCookieValue {
  if (!raw) {
    return { preset: DEFAULT_PRESET, mode: DEFAULT_MODE };
  }
  const [preset, mode] = raw.split(":");
  return {
    preset: preset || DEFAULT_PRESET,
    mode: VALID_MODES.has(mode as ColorMode)
      ? (mode as ColorMode)
      : DEFAULT_MODE,
  };
}

export function serializeThemeCookie(value: ThemeCookieValue): string {
  return `${value.preset}:${value.mode}`;
}
