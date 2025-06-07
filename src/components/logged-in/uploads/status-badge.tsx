import { Badge } from '@/components/ui/badge'
import type { uploadStatusEnum } from '@/db/schema'
import {} from '@tabler/icons-react'

type Status = (typeof uploadStatusEnum.enumValues)[number]

interface StatusBadgeProps {
  status: Status
}

const statusLabel: Record<Status, string> = {
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
}

const statusIcon: Record<Status, React.ReactNode> = {
  queued: <div className="size-2 rounded-full bg-gray-500" />,
  processing: <div className="size-2 rounded-full bg-yellow-500" />,
  completed: <div className="size-2 rounded-full bg-green-500" />,
  failed: <div className="size-2 rounded-full bg-red-500" />,
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="secondary">
      {statusIcon[status]}
      {statusLabel[status]}
    </Badge>
  )
}
