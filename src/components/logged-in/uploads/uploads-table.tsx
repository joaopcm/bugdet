'use client'
import { Table, TableBody, TableHead, TableRow } from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import { useUploads } from '@/hooks/use-uploads'
import { UploadItem } from './upload-item'

export function UploadsTable() {
  const { data: uploads, isLoading } = useUploads()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Uploaded At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {uploads?.map((upload) => (
          <UploadItem key={upload.id} upload={upload} />
        ))}
      </TableBody>
    </Table>
  )
}
