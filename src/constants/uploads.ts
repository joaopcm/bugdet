import type { Status } from '@/components/logged-in/uploads/status-badge'

export const CANCELLABLE_STATUSES: Status[] = [
  'queued',
  'processing',
  'waiting_for_password',
]
export const DELETABLE_STATUSES: Status[] = ['completed', 'failed', 'cancelled']
