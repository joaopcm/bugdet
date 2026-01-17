"use client";

import { IconInfoCircle } from "@tabler/icons-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from "@/constants/uploads";
import type { upload } from "@/db/schema";
import { useInvalidateUploads } from "@/hooks/use-uploads";
import { trpc } from "@/lib/trpc/client";
import { formatBytes } from "@/lib/utils";
import { DoubleConfirmationAlertDialog } from "../double-confirmation-alert-dialog";
import { FileName } from "./file-name";
import { PasswordDialog } from "./password-dialog";
import { StatusBadge } from "./status-badge";

interface UploadItemProps {
  upload: Pick<
    typeof upload.$inferSelect,
    | "id"
    | "fileName"
    | "status"
    | "createdAt"
    | "failedReason"
    | "fileSize"
    | "metadata"
    | "pdfDeleted"
    | "retryCount"
  >;
  isSelected?: boolean;
  onSelect?: (id: string, event: React.MouseEvent) => void;
}

export function UploadItem({
  upload,
  isSelected = false,
  onSelect,
}: UploadItemProps) {
  const invalidate = useInvalidateUploads();
  const [deleteRelatedTransactions, setDeleteRelatedTransactions] =
    useState(false);

  const { mutate: cancelUpload, isPending: isCancelling } =
    trpc.uploads.cancel.useMutation({
      onSuccess: () => {
        invalidate();
        toast.success(
          `You have cancelled the processing of "${upload.fileName}".`
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const { mutate: deleteUpload, isPending: isDeleting } =
    trpc.uploads.delete.useMutation({
      onMutate: () => {
        toast.loading("Deleting upload...", {
          id: `delete-upload-${upload.id}`,
        });
      },
      onSuccess: () => {
        invalidate();
        toast.success(`You have deleted the file "${upload.fileName}".`, {
          id: `delete-upload-${upload.id}`,
        });
      },
      onError: (error) => {
        toast.error(error.message, { id: `delete-upload-${upload.id}` });
      },
    });

  const { mutate: retryUpload, isPending: isRetrying } =
    trpc.uploads.retry.useMutation({
      onMutate: () => {
        toast.loading("Retrying upload...", {
          id: `retry-upload-${upload.id}`,
        });
      },
      onSuccess: () => {
        invalidate();
        toast.success("Processing restarted", {
          id: `retry-upload-${upload.id}`,
          description: "We'll email you once it's done.",
        });
      },
      onError: (error) => {
        toast.error(error.message, { id: `retry-upload-${upload.id}` });
      },
    });

  return (
    <TableRow className="group">
      <TableCell className="relative">
        <Checkbox
          aria-label={`Select upload ${upload.fileName}`}
          checked={isSelected}
          className="absolute top-3 -left-8 hidden opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 md:block"
          onClick={(e) => onSelect?.(upload.id, e)}
        />
        <FileName
          fileName={upload.fileName}
          metadata={upload.metadata}
          uploadId={upload.id}
        />
      </TableCell>
      <TableCell>{formatBytes(upload.fileSize)}</TableCell>
      <TableCell>
        <StatusBadge
          failedReason={upload.failedReason}
          status={upload.status}
        />
      </TableCell>
      <TableCell>
        {format(upload.createdAt, "MMM d, yyyy 'at' hh:mm a")}
      </TableCell>
      <TableCell className="flex items-center gap-2">
        {upload.status === "waiting_for_password" && (
          <PasswordDialog fileName={upload.fileName} uploadId={upload.id}>
            <Button size="sm" variant="default">
              Enter password
            </Button>
          </PasswordDialog>
        )}

        {CANCELLABLE_STATUSES.includes(upload.status) && (
          <DoubleConfirmationAlertDialog
            description="Are you sure you want to cancel the processing of this upload? This action cannot be undone."
            onConfirm={() => cancelUpload({ id: upload.id })}
            title="Cancel processing this upload?"
          >
            <Button disabled={isCancelling} size="sm" variant="destructive">
              Cancel
            </Button>
          </DoubleConfirmationAlertDialog>
        )}

        {upload.status === "failed" &&
          !upload.pdfDeleted &&
          upload.retryCount < 3 && (
            <DoubleConfirmationAlertDialog
              description="This will restart processing from the beginning."
              onConfirm={() => retryUpload({ id: upload.id })}
              title="Retry processing this upload?"
            >
              <Button disabled={isRetrying} size="sm" variant="outline">
                Retry
              </Button>
            </DoubleConfirmationAlertDialog>
          )}

        {DELETABLE_STATUSES.includes(upload.status) && (
          <DoubleConfirmationAlertDialog
            body={
              <div className="flex flex-row items-center gap-2">
                <Checkbox
                  checked={deleteRelatedTransactions}
                  id="deleteRelatedTransactions"
                  onCheckedChange={(checked) =>
                    setDeleteRelatedTransactions(
                      checked === "indeterminate" ? false : checked
                    )
                  }
                />
                <Label
                  className="flex items-center gap-1"
                  htmlFor="deleteRelatedTransactions"
                >
                  Delete related transactions
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconInfoCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px]">
                          Also deletes all transactions that were imported from
                          this upload.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
              </div>
            }
            description="Are you sure you want to delete this upload? This action cannot be undone."
            onConfirm={() =>
              deleteUpload({ id: upload.id, deleteRelatedTransactions })
            }
            title="Delete this upload?"
          >
            <Button disabled={isDeleting} size="sm" variant="destructive">
              Delete
            </Button>
          </DoubleConfirmationAlertDialog>
        )}
      </TableCell>
    </TableRow>
  );
}
