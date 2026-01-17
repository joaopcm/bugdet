"use client";

import { IconLoader2, IconPlus } from "@tabler/icons-react";
import { ChevronsUpDown, XIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
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
import { useCategories } from "@/hooks/use-categories";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

interface CategoryMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function CategoryMultiSelect({
  value,
  onChange,
  placeholder = "Select categories",
  className,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: categories, refetch: refetchCategories } = useCategories({
    ignoreFilters: true,
    ignorePagination: true,
  });

  const { mutate: createCategory, isPending: isCreatingCategory } =
    trpc.categories.create.useMutation({
      onSuccess: (newCategory) => {
        refetchCategories();
        toast.success(`Category "${newCategory.name}" created`);
        onChange([...value, newCategory.id]);
        setSearch("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const selectedCategories = useMemo(
    () => categories?.data.filter((cat) => value.includes(cat.id)) ?? [],
    [categories?.data, value]
  );

  const filteredCategories = useMemo(
    () =>
      categories?.data.filter((cat) =>
        cat.name.toLowerCase().includes(search.toLowerCase())
      ) ?? [],
    [categories?.data, search]
  );

  const exactMatch = useMemo(
    () =>
      categories?.data.some(
        (cat) => cat.name.toLowerCase() === search.toLowerCase()
      ),
    [categories?.data, search]
  );

  const showCreateOption = search.trim() && !exactMatch;

  const handleCreateCategory = useCallback(() => {
    if (!search.trim()) {
      return;
    }
    createCategory({ name: search.trim() });
  }, [search, createCategory]);

  const handleToggle = useCallback(
    (categoryId: string) => {
      if (value.includes(categoryId)) {
        onChange(value.filter((id) => id !== categoryId));
      } else {
        onChange([...value, categoryId]);
      }
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (categoryId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(value.filter((id) => id !== categoryId));
    },
    [value, onChange]
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "h-auto min-h-10 w-full justify-between font-normal hover:bg-card",
            className
          )}
          variant="outline"
        >
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedCategories.length > 0 ? (
              selectedCategories.map((category) => (
                <Badge
                  className="mr-1 py-0 pr-0"
                  key={category.id}
                  variant="secondary"
                >
                  {category.name}
                  {/* biome-ignore lint/a11y/useSemanticElements: nested buttons not allowed */}
                  <span
                    className="cursor-pointer rounded-sm outline-none hover:bg-secondary-foreground/20"
                    onClick={(e) => handleRemove(category.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRemove(
                          category.id,
                          e as unknown as React.MouseEvent
                        );
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <XIcon className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
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
            placeholder="Search or create category..."
            value={search}
          />
          <CommandList onWheel={(e) => e.stopPropagation()}>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => handleToggle(category.id)}
                  value={category.id}
                >
                  <Checkbox
                    checked={value.includes(category.id)}
                    className="mr-2"
                  />
                  {category.name}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  className="cursor-pointer"
                  disabled={isCreatingCategory}
                  onSelect={handleCreateCategory}
                >
                  {isCreatingCategory ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconPlus className="mr-2 h-4 w-4" />
                  )}
                  Create "{search.trim()}"
                </CommandItem>
              )}
              {filteredCategories.length === 0 && !showCreateOption && (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  No category found.
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
