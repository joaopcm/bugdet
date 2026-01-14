'use client'

import { createContext, useContext } from 'react'

interface UploadContextValue {
  triggerUpload: () => void
}

const UploadContext = createContext<UploadContextValue | null>(null)

export function UploadProvider({
  children,
  triggerUpload,
}: {
  children: React.ReactNode
  triggerUpload: () => void
}) {
  return (
    <UploadContext.Provider value={{ triggerUpload }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUploadContext() {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUploadContext must be used within an UploadProvider')
  }
  return context
}
