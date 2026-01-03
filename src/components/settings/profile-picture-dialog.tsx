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
import {
  ALLOWED_PROFILE_PICTURE_TYPES,
  MAX_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURE_DIMENSIONS,
  PROFILE_PICTURE_MAX_SIZE_KB,
} from '@/constants/profile-pictures'
import { authClient } from '@/lib/auth/client'
import { compressImage, getCroppedImage } from '@/lib/image'
import { trpc } from '@/lib/trpc/client'
import { uploadProfilePictureAction } from '@/server/actions/profile-picture'
import { IconLoader2, IconPhoto } from '@tabler/icons-react'
import { useCallback, useRef, useState } from 'react'
import type { Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { ImageCropper } from './image-cropper'

type Step = 'select' | 'crop' | 'uploading'

interface ProfilePictureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfilePictureDialog({
  open,
  onOpenChange,
}: ProfilePictureDialogProps) {
  const { refetch: refetchSession } = authClient.useSession()
  const [step, setStep] = useState<Step>('select')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { mutateAsync: createUploadUrl } =
    trpc.users.createProfilePictureUploadUrl.useMutation()
  const { mutateAsync: updateProfilePicture } =
    trpc.users.updateProfilePicture.useMutation()

  function reset() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setStep('select')
    setPreviewUrl(null)
    setCroppedAreaPixels(null)
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset()
    }
    onOpenChange(nextOpen)
  }

  const handleFileSelect = useCallback((file: File) => {
    if (
      !ALLOWED_PROFILE_PICTURE_TYPES.includes(
        file.type as (typeof ALLOWED_PROFILE_PICTURE_TYPES)[number],
      )
    ) {
      toast.error('Please upload a JPEG, PNG, WebP, or GIF image')
      return
    }
    if (file.size > MAX_PROFILE_PICTURE_SIZE) {
      toast.error('Image must be less than 5MB')
      return
    }

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setStep('crop')
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

  function handleBack() {
    reset()
  }

  async function handleUpload() {
    if (!previewUrl || !croppedAreaPixels) return

    setStep('uploading')

    try {
      const croppedBlob = await getCroppedImage(previewUrl, croppedAreaPixels)

      const compressedFile = await compressImage(
        croppedBlob,
        PROFILE_PICTURE_MAX_SIZE_KB / 1_024,
        PROFILE_PICTURE_DIMENSIONS,
      )

      const { token, path } = await createUploadUrl({
        fileType: 'image/webp',
        fileSize: compressedFile.size,
      })

      await uploadProfilePictureAction(path, token, compressedFile)
      await updateProfilePicture({ filePath: path })
      await refetchSession()

      toast.success('Profile picture updated successfully')
      handleOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload image'
      toast.error(message)
      setStep('crop')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'select' && 'Change profile picture'}
            {step === 'crop' && 'Crop your photo'}
            {step === 'uploading' && 'Uploading...'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' &&
              'Upload a new profile picture. The maximum file size is 5MB.'}
            {step === 'crop' && 'Drag to reposition, use slider to zoom.'}
            {step === 'uploading' && 'Please wait while we process your image.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {step === 'select' && (
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

          {step === 'crop' && previewUrl && (
            <ImageCropper
              imageSrc={previewUrl}
              onCropComplete={setCroppedAreaPixels}
              className="w-full"
            />
          )}

          {step === 'uploading' && (
            <div className="flex h-32 w-32 items-center justify-center">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
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
          {step === 'select' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'crop' && (
            <>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={!croppedAreaPixels}>
                Upload
              </Button>
            </>
          )}

          {step === 'uploading' && <Button disabled>Upload</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
