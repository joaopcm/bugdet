import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import type { SearchParams } from 'nuqs/server'
import { loadSearchParams } from './search-params'

interface ResetPasswordPageProps {
  searchParams: Promise<SearchParams>
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await loadSearchParams(searchParams)

  return <ResetPasswordForm token={token} />
}
