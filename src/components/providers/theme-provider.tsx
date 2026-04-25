"use client";

import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { buildPresetCss, getPreset } from "@/lib/themes/apply";
import type { ColorMode } from "@/lib/themes/types";
import { trpc } from "@/lib/trpc/client";

const STYLE_TAG_ID = "bugdet-theme-vars";

interface ThemeContextValue {
  preset: string;
  setPreset: (slug: string) => void;
  mode: ColorMode;
  setMode: (mode: ColorMode) => void;
  isPending: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function injectPresetCss(slug: string) {
  if (typeof document === "undefined") {
    return;
  }
  const css = buildPresetCss(getPreset(slug));
  let tag = document.getElementById(STYLE_TAG_ID) as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = STYLE_TAG_ID;
    document.head.appendChild(tag);
  }
  tag.textContent = css;
}

function ThemeBridge({
  initialPreset,
  initialMode,
  isAuthenticated,
  children,
}: PropsWithChildren<{
  initialPreset: string;
  initialMode: ColorMode;
  isAuthenticated: boolean;
}>) {
  const [preset, setPresetState] = useState(initialPreset);
  const { theme, setTheme } = useNextTheme();
  const mode = ((theme as ColorMode | undefined) ??
    initialMode) satisfies ColorMode;

  const utils = trpc.useUtils();
  const updateTheme = trpc.settings.updateTheme.useMutation({
    onSuccess: () => utils.settings.get.invalidate(),
  });

  const settingsQuery = trpc.settings.get.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const settingsData = settingsQuery.data;
  useEffect(() => {
    if (!settingsData) {
      return;
    }
    const driftsFromCookie =
      settingsData.themePreset !== preset || settingsData.colorMode !== mode;
    if (!driftsFromCookie) {
      return;
    }
    setPresetState(settingsData.themePreset);
    injectPresetCss(settingsData.themePreset);
    setTheme(settingsData.colorMode);
    updateTheme.mutate({
      themePreset: settingsData.themePreset,
      colorMode: settingsData.colorMode,
    });
  }, [settingsData, mode, preset, setTheme, updateTheme.mutate]);

  const setPreset = useCallback(
    (slug: string) => {
      setPresetState(slug);
      injectPresetCss(slug);
      updateTheme.mutate({ themePreset: slug, colorMode: mode });
    },
    [mode, updateTheme]
  );

  const setMode = useCallback(
    (next: ColorMode) => {
      setTheme(next);
      updateTheme.mutate({ themePreset: preset, colorMode: next });
    },
    [preset, setTheme, updateTheme]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      preset,
      setPreset,
      mode,
      setMode,
      isPending: updateTheme.isPending,
    }),
    [preset, setPreset, mode, setMode, updateTheme.isPending]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function ThemeProvider({
  initialPreset,
  initialMode,
  isAuthenticated,
  children,
}: PropsWithChildren<{
  initialPreset: string;
  initialMode: ColorMode;
  isAuthenticated: boolean;
}>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={initialMode}
      disableTransitionOnChange
      enableSystem
    >
      <ThemeBridge
        initialMode={initialMode}
        initialPreset={initialPreset}
        isAuthenticated={isAuthenticated}
      >
        {children}
      </ThemeBridge>
    </NextThemesProvider>
  );
}

export function useThemeSettings() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeSettings must be used within ThemeProvider");
  }
  return ctx;
}
