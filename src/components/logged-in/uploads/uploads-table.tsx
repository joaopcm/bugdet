'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import { trpc } from '@/lib/trpc/client'
import { format } from 'date-fns'

export function UploadsTable() {
  const { data: uploads, isLoading } = trpc.uploads.list.useQuery()

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
          <TableRow key={upload.id}>
            <TableCell>{upload.filename}</TableCell>
            <TableCell>{upload.status}</TableCell>
            <TableCell>
              {format(upload.createdAt, "MMM d, yyyy 'at' hh:mm a")}
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm">
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
