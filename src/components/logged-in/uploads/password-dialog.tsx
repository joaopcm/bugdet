'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { toast } from 'sonner'

interface PasswordDialogProps {
  uploadId: string
  fileName: string
  children: React.ReactNode
}

export function PasswordDialog({
  uploadId,
  fileName,
  children,
}: PasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const { refetch } = useUploads()

  const { mutate: setUploadPassword, isPending } =
    trpc.uploads.setPassword.useMutation({
      onSuccess: () => {
        toast.success('Password submitted. Processing will resume shortly.')
        setOpen(false)
        setPassword('')
        refetch()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error('Please enter a password')
      return
    }
    setUploadPassword({ uploadId, password })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Enter PDF password</DialogTitle>
            <DialogDescription>
              The file <strong>{fileName}</strong> is password-protected. Enter
              the password to process it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the PDF password"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !password.trim()}>
              {isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
