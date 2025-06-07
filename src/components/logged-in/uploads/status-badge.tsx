import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { uploadStatusEnum } from '@/db/schema'

export type Status = (typeof uploadStatusEnum.enumValues)[number]

interface StatusBadgeProps {
  status: Status
  failedReason: string | null
}

const statusLabel: Record<Status, string> = {
  queued: 'Queued',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const statusIcon: Record<Status, React.ReactNode> = {
  queued: <div className="size-2 rounded-full bg-gray-400" />,
  processing: <div className="size-2 rounded-full bg-yellow-500" />,
  completed: <div className="size-2 rounded-full bg-green-500" />,
  failed: <div className="size-2 rounded-full bg-red-500" />,
  cancelled: <div className="size-2 rounded-full bg-gray-400" />,
}

export function StatusBadge({ status, failedReason }: StatusBadgeProps) {
  if (status !== 'failed' || !failedReason) {
    return (
      <Badge variant="secondary" className="select-none">
        {statusIcon[status]}
        {statusLabel[status]}
      </Badge>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="select-none">
          {statusIcon[status]}
          {statusLabel[status]}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{failedReason}</p>
      </TooltipContent>
    </Tooltip>
  )
}
