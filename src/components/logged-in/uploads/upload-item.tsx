'use client'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
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
        <Button variant="outline" size="sm">
          Download
        </Button>

        {(upload.status === 'queued' || upload.status === 'processing') && (
          <Button
            variant="destructive"
            size="sm"
            disabled={isCancelling}
            onClick={() => cancelUpload({ id: upload.id })}
          >
            Cancel
          </Button>
        )}

        {(upload.status === 'completed' || upload.status === 'cancelled') && (
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
