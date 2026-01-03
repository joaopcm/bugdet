'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import { TableHeader } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useBulkSelection } from '@/hooks/use-bulk-selection'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { IconInfoCircle } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'
import { FloatingActionBar } from '../bulk-actions/floating-action-bar'
import { EmptyState } from '../empty-state'
import { UploadsFilters } from './filters'
import { LoadingState } from './loading-state'
import { UploadItem } from './upload-item'
import { UploadsPagination } from './uploads-pagination'

export function UploadsTable() {
  const { data: uploads, isLoading, refetch } = useUploads()
  const [deleteRelatedTransactions, setDeleteRelatedTransactions] =
    useState(false)

  const itemIds = useMemo(
    () => uploads?.data?.map((u) => u.id) ?? [],
    [uploads?.data],
  )

  const {
    selectedIds,
    isAllSelected,
    isPartiallySelected,
    handleClick,
    toggleAll,
    selectAll,
    clearSelection,
  } = useBulkSelection({ itemIds })

  useHotkeys('mod+a', selectAll, { preventDefault: true })

  const { mutate: deleteMany, isPending: isDeleting } =
    trpc.uploads.deleteMany.useMutation({
      onSuccess: (result) => {
        toast.success(`Deleted ${result.deletedCount} upload(s)`)
        clearSelection()
        setDeleteRelatedTransactions(false)
        refetch()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const handleBulkDelete = () => {
    deleteMany({ ids: Array.from(selectedIds), deleteRelatedTransactions })
  }

  return (
    <div className="flex flex-col gap-4">
      <UploadsFilters />
      <div className="relative overflow-visible">
        <Checkbox
          checked={isAllSelected}
          indeterminate={isPartiallySelected}
          onCheckedChange={toggleAll}
          className="absolute -left-8 top-2.5 opacity-0 hover:opacity-100 data-[state=checked]:opacity-100 data-[state=indeterminate]:opacity-100"
          aria-label="Select all uploads"
        />
        <Table containerClassName="overflow-visible">
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

            {uploads?.data.map((upload) => (
              <UploadItem
                key={upload.id}
                upload={upload}
                isSelected={selectedIds.has(upload.id)}
                onSelect={handleClick}
              />
            ))}

            {uploads?.data.length === 0 && (
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
      </div>

      <UploadsPagination hasMore={!!uploads?.hasMore} />

      <FloatingActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
        className="w-[560px]"
      >
        <div className="flex items-center gap-2 border-l pl-4">
          <Checkbox
            id="bulkDeleteRelatedTransactions"
            checked={deleteRelatedTransactions}
            onCheckedChange={(checked) =>
              setDeleteRelatedTransactions(
                checked === 'indeterminate' ? false : checked,
              )
            }
          />
          <Label
            htmlFor="bulkDeleteRelatedTransactions"
            className="flex cursor-pointer items-center gap-1 text-sm"
          >
            Delete related transactions
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="text-muted-foreground h-4 w-4" />
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
  )
}
