"use client";

import { format, isSameDay, startOfYear, subDays, subMonths } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const DATE_PRESETS = ["7d", "30d", "3m", "6m", "ytd", "custom"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export function getPresetLabel(preset: DatePreset): string {
  switch (preset) {
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "3m":
      return "Last 3 months";
    case "6m":
      return "Last 6 months";
    case "ytd":
      return "Year to date";
    default:
      return "Custom";
  }
}

export function getDateRangeFromPreset(preset: Exclude<DatePreset, "custom">): {
  from: Date;
  to: Date;
} {
  const now = new Date();

  switch (preset) {
    case "7d":
      return { from: subDays(now, 7), to: now };
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "3m":
      return { from: subMonths(now, 3), to: now };
    case "6m":
      return { from: subMonths(now, 6), to: now };
    default:
      return { from: startOfYear(now), to: now };
  }
}

export function getActivePreset(
  from: Date | null,
  to: Date | null
): DatePreset {
  if (!(from && to)) {
    return "30d";
  }

  const presets = ["7d", "30d", "3m", "6m", "ytd"] as const;
  for (const preset of presets) {
    const range = getDateRangeFromPreset(preset);
    if (isSameDay(from, range.from) && isSameDay(to, range.to)) {
      return preset;
    }
  }

  return "custom";
}

interface DateRangeFilterProps {
  from: Date | null;
  to: Date | null;
  onFilterChange: (updates: { from: Date; to: Date }) => void;
}

export function DateRangeFilter({
  from,
  to,
  onFilterChange,
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [localRange, setLocalRange] = useState<DateRange | undefined>();
  const [clickCount, setClickCount] = useState(0);

  const activePreset = useMemo(() => getActivePreset(from, to), [from, to]);

  const handleOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
    if (open) {
      setClickCount(0);
      setLocalRange(
        from
          ? { from: new Date(from), to: to ? new Date(to) : undefined }
          : undefined
      );
    }
  };

  const handlePresetClick = (preset: Exclude<DatePreset, "custom">) => {
    const range = getDateRangeFromPreset(preset);
    onFilterChange(range);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      return;
    }
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);
    setLocalRange(range);
    if (newClickCount >= 2 && range.to && !isSameDay(range.from, range.to)) {
      onFilterChange({ from: range.from, to: range.to });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {DATE_PRESETS.filter((p) => p !== "custom").map((presetOption) => (
        <Button
          key={presetOption}
          onClick={() => handlePresetClick(presetOption)}
          size="sm"
          variant={activePreset === presetOption ? "default" : "outline"}
        >
          {getPresetLabel(presetOption)}
        </Button>
      ))}

      <Popover onOpenChange={handleOpenChange} open={isCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            className="min-w-[140px] justify-start text-left font-normal"
            size="sm"
            variant={activePreset === "custom" ? "default" : "outline"}
          >
            <CalendarIcon className="size-4" />
            {activePreset === "custom" && from && to ? (
              `${format(from, "MMM d")} - ${format(to, "MMM d")}`
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            captionLayout="dropdown"
            mode="range"
            numberOfMonths={2}
            onSelect={handleDateSelect}
            selected={localRange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
