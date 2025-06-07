'use client'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from '@/constants/uploads'
import type { upload } from '@/db/schema'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { StatusBadge } from './status-badge'

interface UploadItemProps {
  upload: Pick<
    typeof upload.$inferSelect,
    'id' | 'fileName' | 'status' | 'createdAt'
  >
}

export function UploadItem({ upload }: UploadItemProps) {
  const { refetch: refetchUploads } = useUploads()

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
      <TableCell>{upload.fileName}</TableCell>
      <TableCell>
        <StatusBadge status={upload.status} />
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
          <Button
            variant="destructive"
            size="sm"
            disabled={isCancelling}
            onClick={() => cancelUpload({ id: upload.id })}
          >
            Cancel
          </Button>
        )}

        {DELETABLE_STATUSES.includes(upload.status) && (
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => deleteUpload({ id: upload.id })}
          >
            Delete
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
