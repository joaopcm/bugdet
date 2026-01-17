"use client";

import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePagination } from "@/hooks/use-pagination";
import { trpc } from "@/lib/trpc/client";
import { useTransactionsFilters } from "./search-params";

const UPLOAD_SHORTCUT = "U";

export function UploadFilter() {
  const { data: uploads } = trpc.uploads.listForFilter.useQuery();
  const { transactionFilters, setTransactionFilters } =
    useTransactionsFilters();
  const { setPagination } = usePagination("transactions");
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(UPLOAD_SHORTCUT, (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  });

  return (
    <Select
      onOpenChange={setIsOpen}
      onValueChange={(value) => {
        setTransactionFilters({ uploadId: value });
        setPagination({ page: 1 });
      }}
      open={isOpen}
      value={transactionFilters.uploadId || undefined}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectTrigger className="w-full" id="uploadId">
            <SelectValue placeholder="Select an upload" />
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Or press <Kbd variant="outline">{UPLOAD_SHORTCUT}</Kbd> to filter by a
          specific upload
        </TooltipContent>
      </Tooltip>
      <SelectContent>
        <SelectItem value="all">All uploads</SelectItem>
        {uploads?.data.map((upload) => (
          <SelectItem key={upload.id} value={upload.id}>
            {upload.fileName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
