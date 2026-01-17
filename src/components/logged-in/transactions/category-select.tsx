"use client";

import { IconCheck, IconLoader2, IconPlus } from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface CategorySelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  value,
  onChange,
  placeholder = "Select a category",
  className,
}: CategorySelectProps) {
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
        onChange(newCategory.id);
        setSearch("");
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const selectedCategory = categories?.data.find((cat) => cat.id === value);

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

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          variant="outline"
        >
          {selectedCategory?.name ?? placeholder}
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
          <CommandList>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  onSelect={() => {
                    onChange(category.id);
                    setSearch("");
                    setOpen(false);
                  }}
                  value={category.id}
                >
                  <IconCheck
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
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
