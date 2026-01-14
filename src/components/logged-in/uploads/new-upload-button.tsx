'use client'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { useUploadContext } from '@/contexts/upload-context'
import { useHotkeys } from 'react-hotkeys-hook'

const NEW_UPLOAD_SHORTCUT = 'N'

export function NewUploadButton() {
  const { triggerUpload } = useUploadContext()

  useHotkeys(NEW_UPLOAD_SHORTCUT, () => triggerUpload())

  return (
    <Button onClick={triggerUpload}>
      New upload
      <Kbd variant="default" className="-mr-2">
        {NEW_UPLOAD_SHORTCUT}
      </Kbd>
    </Button>
  )
}
