'use client'

import { UploadProvider } from '@/contexts/upload-context'
import type { User } from 'better-auth'
import { useCallback, useRef } from 'react'
import { AppSidebar } from './app-sidebar'

interface LoggedInLayoutClientProps {
  user: User
  children: React.ReactNode
}

export function LoggedInLayoutClient({
  user,
  children,
}: LoggedInLayoutClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <UploadProvider triggerUpload={triggerUpload}>
      <AppSidebar variant="inset" user={user} fileInputRef={fileInputRef} />
      {children}
    </UploadProvider>
  )
}
