"use client";

import { IconInfoCircle } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useUploads } from "@/hooks/use-uploads";
import { trpc } from "@/lib/trpc/client";
import { pluralize } from "@/lib/utils";
import { FloatingActionBar } from "../bulk-actions/floating-action-bar";
import { EmptyState } from "../empty-state";
import { UploadsFilters } from "./filters";
import { LoadingState } from "./loading-state";
import { UploadItem } from "./upload-item";
import { UploadsPagination } from "./uploads-pagination";

export function UploadsTable() {
  const isMobile = useIsMobile();
  const { data: uploads, isLoading, refetch } = useUploads();
  const [deleteRelatedTransactions, setDeleteRelatedTransactions] =
    useState(false);

  const itemIds = useMemo(
    () => uploads?.data?.map((u) => u.id) ?? [],
    [uploads?.data]
  );

  const {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    selectAll,
    clearSelection,
  } = useBulkSelection({ itemIds });

  useHotkeys("mod+a", selectAll, { preventDefault: true, enabled: !isMobile });

  const { mutate: deleteMany, isPending: isDeleting } =
    trpc.uploads.deleteMany.useMutation({
      onMutate: () => {
        toast.loading("Deleting uploads...", { id: "delete-uploads" });
      },
      onSuccess: (result) => {
        toast.success(
          `Deleted ${result.deletedCount} ${pluralize(result.deletedCount, "upload")}`,
          { id: "delete-uploads" }
        );
        clearSelection();
        setDeleteRelatedTransactions(false);
        refetch();
      },
      onError: (error) => {
        toast.error(error.message, { id: "delete-uploads" });
      },
    });

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds), deleteRelatedTransactions });
  };

  return (
    <div className="flex flex-col gap-4">
      <UploadsFilters />
      <div className="relative overflow-visible">
        <Checkbox
          aria-label="Select all uploads"
          checked={isAllSelected}
          className="absolute top-2.5 -left-8 hidden opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100 md:block"
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
        />
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%]">File name</TableHead>
              <TableHead className="w-[15%]">File size</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[20%]">Uploaded at</TableHead>
              <TableHead className="w-[15%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <LoadingState />}

            {uploads?.data.map((upload) => (
              <UploadItem
                isSelected={selectedIds.has(upload.id)}
                key={upload.id}
                onSelect={handleClick}
                upload={upload}
              />
            ))}

            {uploads?.data.length === 0 && (
              <TableRow>
                <TableCell className="py-10" colSpan={5}>
                  <EmptyState
                    description="Upload your bank statements to get started."
                    title="No uploads found."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UploadsPagination hasMore={!!uploads?.hasMore} />

      <FloatingActionBar
        className="w-[560px]"
        isDeleting={isDeleting}
        onDelete={handleBulkDelete}
        selectedCount={selectedIds.size}
      >
        <div className="flex items-center gap-2 border-l pl-4">
          <Checkbox
            checked={deleteRelatedTransactions}
            id="bulkDeleteRelatedTransactions"
            onCheckedChange={(checked) =>
              setDeleteRelatedTransactions(
                checked === "indeterminate" ? false : checked
              )
            }
          />
          <Label
            className="flex cursor-pointer items-center gap-1 text-sm"
            htmlFor="bulkDeleteRelatedTransactions"
          >
            Delete related transactions
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px]">
                    Also deletes all transactions imported from selected
                    uploads.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
        </div>
      </FloatingActionBar>
    </div>
  );
}
