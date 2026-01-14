'use client'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { useHotkeys } from 'react-hotkeys-hook'

const NEW_UPLOAD_SHORTCUT = 'N'

export function NewUploadButton() {
  function triggerUpload() {
    document.getElementById('bank-statement-upload')?.click()
  }

  useHotkeys(NEW_UPLOAD_SHORTCUT, triggerUpload)

  return (
    <Button onClick={triggerUpload}>
      New upload
      <Kbd variant="default" className="-mr-2">
        {NEW_UPLOAD_SHORTCUT}
      </Kbd>
    </Button>
  )
}
