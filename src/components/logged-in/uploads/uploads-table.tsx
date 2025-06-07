import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'

export function UploadsTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>File Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Uploaded At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>1</TableCell>
          <TableCell>test.pdf</TableCell>
          <TableCell>Completed</TableCell>
          <TableCell>2021-01-01</TableCell>
          <TableCell>
            <Button variant="outline" size="sm">
              View
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
