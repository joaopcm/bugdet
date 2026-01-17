"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { INDUSTRIES } from "@/constants/onboarding";
import { cn } from "@/lib/utils";

interface IndustrySelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function IndustrySelect({ value, onChange }: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIndustry = INDUSTRIES.find((i) => i.value === value);

  const filteredIndustries = INDUSTRIES.filter((industry) => {
    if (!search.trim()) {
      return true;
    }
    const searchLower = search.toLowerCase();
    return (
      industry.label.toLowerCase().includes(searchLower) ||
      industry.keywords.some((keyword) =>
        keyword.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="w-full justify-between font-normal"
          variant="outline"
        >
          {selectedIndustry?.label ?? "Select your industry..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-0 p-0"
      >
        <Command className="w-full" shouldFilter={false}>
          <CommandInput
            onValueChange={setSearch}
            placeholder="Search industries..."
            value={search}
          />
          <CommandList>
            <CommandEmpty>No industry found.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  className="text-muted-foreground"
                  onSelect={() => {
                    onChange(null);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  Clear selection
                </CommandItem>
              )}
              {filteredIndustries.map((industry) => (
                <CommandItem
                  key={industry.value}
                  onSelect={() => {
                    onChange(industry.value);
                    setSearch("");
                    setOpen(false);
                  }}
                  value={industry.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === industry.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {industry.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
