export type ColorMode = "light" | "dark" | "system";

export type CssVarMap = Record<string, string>;

export interface Preset {
  name: string;
  title: string;
  description: string;
  cssVars: {
    theme: CssVarMap;
    light: CssVarMap;
    dark: CssVarMap;
  };
}
