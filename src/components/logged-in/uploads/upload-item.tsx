'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from '@/constants/uploads'
import type { upload } from '@/db/schema'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { formatBytes } from '@/lib/utils'
import { IconInfoCircle } from '@tabler/icons-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { FileName } from './file-name'
import { PasswordDialog } from './password-dialog'
import { StatusBadge } from './status-badge'

interface UploadItemProps {
  upload: Pick<
    typeof upload.$inferSelect,
    | 'id'
    | 'fileName'
    | 'status'
    | 'createdAt'
    | 'failedReason'
    | 'fileSize'
    | 'metadata'
  >
  isSelected?: boolean
  onSelect?: (id: string, event: React.MouseEvent) => void
}

export function UploadItem({
  upload,
  isSelected = false,
  onSelect,
}: UploadItemProps) {
  const { refetch: refetchUploads } = useUploads()
  const [deleteRelatedTransactions, setDeleteRelatedTransactions] =
    useState(false)

  const { mutate: cancelUpload, isPending: isCancelling } =
    trpc.uploads.cancel.useMutation({
      onSuccess: () => {
        refetchUploads()
        toast.success(
          `You have cancelled the processing of "${upload.fileName}".`,
        )
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const { mutate: deleteUpload, isPending: isDeleting } =
    trpc.uploads.delete.useMutation({
      onMutate: () => {
        toast.loading('Deleting upload...', { id: `delete-upload-${upload.id}` })
      },
      onSuccess: () => {
        refetchUploads()
        toast.success(`You have deleted the file "${upload.fileName}".`, {
          id: `delete-upload-${upload.id}`,
        })
      },
      onError: (error) => {
        toast.error(error.message, { id: `delete-upload-${upload.id}` })
      },
    })

  const { mutate: downloadUpload, isPending: isDownloading } =
    trpc.uploads.download.useMutation({
      onSuccess: (data) => {
        window.open(data.url, '_blank')
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  return (
    <TableRow className="group">
      <TableCell className="relative">
        <Checkbox
          checked={isSelected}
          onClick={(e) => onSelect?.(upload.id, e)}
          className="absolute -left-8 top-3 hidden opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 md:block"
          aria-label={`Select upload ${upload.fileName}`}
        />
        <FileName fileName={upload.fileName} metadata={upload.metadata} />
      </TableCell>
      <TableCell>{formatBytes(upload.fileSize)}</TableCell>
      <TableCell>
        <StatusBadge
          status={upload.status}
          failedReason={upload.failedReason}
        />
      </TableCell>
      <TableCell>
        {format(upload.createdAt, "MMM d, yyyy 'at' hh:mm a")}
      </TableCell>
      <TableCell className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isDownloading}
          onClick={() => downloadUpload({ id: upload.id })}
        >
          Download
        </Button>

        {upload.status === 'waiting_for_password' && (
          <PasswordDialog uploadId={upload.id} fileName={upload.fileName}>
            <Button variant="default" size="sm">
              Enter password
            </Button>
          </PasswordDialog>
        )}

        {CANCELLABLE_STATUSES.includes(upload.status) && (
          <DoubleConfirmationAlertDialog
            title="Cancel processing this upload?"
            description="Are you sure you want to cancel the processing of this upload? This action cannot be undone."
            onConfirm={() => cancelUpload({ id: upload.id })}
          >
            <Button variant="destructive" size="sm" disabled={isCancelling}>
              Cancel
            </Button>
          </DoubleConfirmationAlertDialog>
        )}

        {DELETABLE_STATUSES.includes(upload.status) && (
          <DoubleConfirmationAlertDialog
            title="Delete this upload?"
            description="Are you sure you want to delete this upload? This action cannot be undone."
            onConfirm={() =>
              deleteUpload({ id: upload.id, deleteRelatedTransactions })
            }
            body={
              <div className="flex flex-row items-center gap-2">
                <Checkbox
                  id="deleteRelatedTransactions"
                  checked={deleteRelatedTransactions}
                  onCheckedChange={(checked) =>
                    setDeleteRelatedTransactions(
                      checked === 'indeterminate' ? false : checked,
                    )
                  }
                />
                <Label
                  htmlFor="deleteRelatedTransactions"
                  className="flex items-center gap-1"
                >
                  Delete related transactions
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconInfoCircle className="text-muted-foreground h-4 w-4" />
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
          >
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              Delete
            </Button>
          </DoubleConfirmationAlertDialog>
        )}
      </TableCell>
    </TableRow>
  )
}
