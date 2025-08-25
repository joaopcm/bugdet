'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { TableCell, TableRow } from '@/components/ui/table'
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from '@/constants/uploads'
import type { upload } from '@/db/schema'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { formatBytes } from '@/lib/utils'
import { format } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import { DoubleConfirmationAlertDialog } from '../double-confirmation-alert-dialog'
import { FileName } from './file-name'
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
}

export function UploadItem({ upload }: UploadItemProps) {
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
      onSuccess: () => {
        refetchUploads()
        toast.success(`You have deleted the file "${upload.fileName}".`)
      },
      onError: (error) => {
        toast.error(error.message)
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
    <TableRow>
      <TableCell>
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
                <Label htmlFor="deleteRelatedTransactions">
                  Delete related transactions
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
