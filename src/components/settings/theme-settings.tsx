"use client";

import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useThemeSettings } from "@/components/providers/theme-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PRESETS } from "@/lib/themes/presets.generated";
import type { ColorMode, Preset } from "@/lib/themes/types";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: Array<{
  value: ColorMode;
  label: string;
  icon: typeof IconSun;
}> = [
  { value: "light", label: "Light", icon: IconSun },
  { value: "dark", label: "Dark", icon: IconMoon },
  { value: "system", label: "System", icon: IconDeviceDesktop },
];

function PresetSwatch({
  preset,
  isActive,
  mode,
  onSelect,
}: {
  preset: Preset;
  isActive: boolean;
  mode: "light" | "dark";
  onSelect: () => void;
}) {
  const vars = preset.cssVars[mode];
  const bg = vars.background;
  const primary = vars.primary;
  const card = vars.card;
  const foreground = vars.foreground;
  const border = vars.border;

  return (
    <button
      aria-label={`Select ${preset.title} theme`}
      aria-pressed={isActive}
      className={cn(
        "group flex flex-col items-start gap-2 rounded-md p-2 text-left transition-colors",
        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive && "bg-accent"
      )}
      onClick={onSelect}
      type="button"
    >
      <div
        aria-hidden="true"
        className={cn(
          "relative h-16 w-full overflow-hidden rounded border transition-all",
          isActive
            ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
            : "border-border"
        )}
        style={{ background: bg, borderColor: border }}
      >
        <div
          className="absolute top-1 left-1 h-3 w-8 rounded-sm"
          style={{ background: primary }}
        />
        <div
          className="absolute top-5 left-1 h-3 w-12 rounded-sm"
          style={{ background: card, border: `1px solid ${border}` }}
        />
        <div
          className="absolute bottom-1 left-1 h-2 w-10 rounded-sm"
          style={{ background: foreground, opacity: 0.6 }}
        />
      </div>
      <span className="font-semibold text-foreground text-xs">
        {preset.title}
      </span>
    </button>
  );
}

function resolvePreviewMode(mode: ColorMode): "light" | "dark" {
  if (mode === "light") {
    return "light";
  }
  if (mode === "dark") {
    return "dark";
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export function ThemeSettings() {
  const { preset, setPreset, mode, setMode } = useThemeSettings();
  const previewMode = resolvePreviewMode(mode);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Pick a color theme and whether the app should follow light, dark, or
          your system preference.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-sm">Mode</span>
          <ToggleGroup
            className="w-fit"
            onValueChange={(value) => {
              if (value) {
                setMode(value as ColorMode);
              }
            }}
            type="single"
            value={mode}
            variant="outline"
          >
            {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem
                aria-label={label}
                className="gap-2 px-3"
                key={value}
                value={value}
              >
                <Icon size={16} />
                <span>{label}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-semibold text-sm">Theme</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {PRESETS.map((p) => (
              <PresetSwatch
                isActive={p.name === preset}
                key={p.name}
                mode={previewMode}
                onSelect={() => setPreset(p.name)}
                preset={p}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
