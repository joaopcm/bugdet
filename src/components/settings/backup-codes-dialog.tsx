'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth/client'
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface BackupCodesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'password' | 'codes'

export function BackupCodesDialog({
  open,
  onOpenChange,
}: BackupCodesDialogProps) {
  const [step, setStep] = useState<Step>('password')
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [copiedCodes, setCopiedCodes] = useState(false)

  function reset() {
    setStep('password')
    setPassword('')
    setBackupCodes([])
    setCopiedCodes(false)
    setIsLoading(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  async function handleGetBackupCodes() {
    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setIsLoading(true)

    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    if (data?.backupCodes) {
      setBackupCodes(data.backupCodes)
      setStep('codes')
    }

    setIsLoading(false)
  }

  async function handleRegenerateCodes() {
    setIsLoading(true)

    const { data, error } = await authClient.twoFactor.generateBackupCodes({
      password,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    if (data?.backupCodes) {
      setBackupCodes(data.backupCodes)
      toast.success('Backup codes regenerated. Previous codes are now invalid.')
    }

    setIsLoading(false)
  }

  async function handleCopyBackupCodes() {
    const codesText = backupCodes.join('\n')
    await navigator.clipboard.writeText(codesText)
    setCopiedCodes(true)
    toast.success('Backup codes copied to clipboard')
    setTimeout(() => setCopiedCodes(false), 2000)
  }

  function handleDownloadBackupCodes() {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bugdet-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Backup codes downloaded')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {step === 'password' && (
          <>
            <DialogHeader>
              <DialogTitle>View backup codes</DialogTitle>
              <DialogDescription>
                Enter your password to view your backup codes.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleGetBackupCodes}
                disabled={isLoading || !password}
              >
                {isLoading ? 'Verifying...' : 'View codes'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'codes' && (
          <>
            <DialogHeader>
              <DialogTitle>Backup codes</DialogTitle>
              <DialogDescription>
                Each code can only be used once. Used codes will not appear
                here.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                {backupCodes.map((code, index) => (
                  <code key={code} className="font-mono text-sm">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopyBackupCodes}
                >
                  {copiedCodes ? (
                    <IconCheck className="size-4" />
                  ) : (
                    <IconCopy className="size-4" />
                  )}
                  {copiedCodes ? 'Copied!' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDownloadBackupCodes}
                >
                  <IconDownload className="size-4" />
                  Download
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={handleRegenerateCodes}
                disabled={isLoading}
              >
                <IconRefresh className="size-4" />
                {isLoading ? 'Regenerating...' : 'Regenerate codes'}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
