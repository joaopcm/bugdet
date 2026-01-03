'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { authClient } from '@/lib/auth/client'
import { trpc } from '@/lib/trpc/client'
import { uploadProfilePictureAction } from '@/server/actions/profile-picture'
import { IconPhoto, IconX } from '@tabler/icons-react'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

interface ProfilePictureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ProfilePictureDialog({
  open,
  onOpenChange,
}: ProfilePictureDialogProps) {
  const { data: session, refetch: refetchSession } = authClient.useSession()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: createUploadUrl } =
    trpc.users.createProfilePictureUploadUrl.useMutation()
  const { mutateAsync: updateProfilePicture } =
    trpc.users.updateProfilePicture.useMutation()

  function reset() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setIsUploading(false)
    setIsDragging(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  const handleFileSelect = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be less than 5MB')
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect],
  )

  function handleRemoveSelected() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleUpload() {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      // 1. Get signed upload URL
      const { signedUrl, token, path } = await createUploadUrl({
        fileType: selectedFile.type as
          | 'image/jpeg'
          | 'image/png'
          | 'image/webp'
          | 'image/gif',
        fileSize: selectedFile.size,
      })

      // 2. Upload file to Supabase
      await uploadProfilePictureAction(path, token, selectedFile)

      // 3. Update user profile with new image URL
      await updateProfilePicture({ filePath: path })

      // 4. Refetch session to update UI
      await refetchSession()

      toast.success('Profile picture updated successfully')
      handleOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload image'
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const userName = session?.user?.name || 'User'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change profile picture</DialogTitle>
          <DialogDescription>
            Upload a new profile picture. The maximum file size is 5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {previewUrl ? (
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={previewUrl} alt="Preview" />
                <AvatarFallback className="text-2xl">
                  {userName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemoveSelected}
                disabled={isUploading}
              >
                <IconX className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className={`flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <IconPhoto className="h-8 w-8 text-muted-foreground" />
              <span className="mt-1 text-xs text-muted-foreground">
                Drop or click
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
