import { PRESETS } from "./presets.generated";
import type { CssVarMap, Preset } from "./types";

const PRESETS_BY_SLUG: ReadonlyMap<string, Preset> = new Map(
  PRESETS.map((p) => [p.name, p])
);

export function getPreset(slug: string): Preset {
  return PRESETS_BY_SLUG.get(slug) ?? PRESETS[0];
}

function varsToBlock(vars: CssVarMap): string {
  return Object.entries(vars)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join("\n");
}

export function buildPresetCss(preset: Preset): string {
  const theme = varsToBlock(preset.cssVars.theme);
  const light = varsToBlock(preset.cssVars.light);
  const dark = varsToBlock(preset.cssVars.dark);
  return `:root {\n${theme}\n${light}\n}\n.dark {\n${dark}\n}`;
}
