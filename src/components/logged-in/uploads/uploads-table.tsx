'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import { useUploads } from '@/hooks/use-uploads'
import { EmptyState } from '../empty-state'
import { LoadingState } from './loading-state'
import { UploadItem } from './upload-item'

export function UploadsTable() {
  const { data: uploads, isLoading } = useUploads()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[35%]">File Name</TableHead>
          <TableHead className="w-[15%]">File Size</TableHead>
          <TableHead className="w-[15%]">Status</TableHead>
          <TableHead className="w-[20%]">Uploaded At</TableHead>
          <TableHead className="w-[15%]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && <LoadingState />}

        {uploads?.map((upload) => (
          <UploadItem key={upload.id} upload={upload} />
        ))}

        {uploads?.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-10">
              <EmptyState
                title="No uploads found."
                description="Upload your bank statements to get started."
              />
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
