'use client'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { uploadToSignedUrlAction } from '@/server/actions/uploads'
import type { SignedUploadUrl } from '@/server/routers/uploads'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'sonner'

const NEW_UPLOAD_SHORTCUT = 'N'

export function NewUploadButton() {
  const [files, setFiles] = useState<File[] | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { refetch: refetchUploads } = useUploads()

  useHotkeys(NEW_UPLOAD_SHORTCUT, () => handleUploadClick())

  const { mutate: createSignedUploadUrls } =
    trpc.uploads.createSignedUploadUrls.useMutation({
      onMutate: () => {
        setIsUploading(true)
        toast.loading('Preparing bank statements upload...', {
          id: 'upload-bank-statement',
          description: null,
        })
      },
      onError: (error) => {
        setIsUploading(false)
        toast.error(error.message, {
          id: 'upload-bank-statement',
          description: null,
        })
      },
      onSuccess: async ({ uploadUrls }) => {
        const successfulUploads = await uploadToSignedUrls(uploadUrls)
        processUploads({
          files: successfulUploads.map((upload) => ({
            fileSize: upload.file.size,
            fileName: upload.file.name,
            filePath: upload.signedUrlConfig.path,
          })),
        })
        setFiles(null)
      },
    })

  async function uploadToSignedUrls(configs: SignedUploadUrl[]) {
    if (!files) {
      throw new Error('No files to upload.')
    }

    const fileNameToSignedUrlConfigMap = new Map<string, SignedUploadUrl>()
    for (const config of configs) {
      fileNameToSignedUrlConfigMap.set(config.originalFileName, config)
    }

    toast.loading('Uploading bank statements...', {
      id: 'upload-bank-statement',
      description: null,
    })

    const successfulUploads: {
      file: File
      signedUrlConfig: SignedUploadUrl
    }[] = []

    for (const file of files) {
      const signedUrlConfig = fileNameToSignedUrlConfigMap.get(file.name)

      if (!signedUrlConfig) {
        toast.error(`Failed to upload "${file.name}".`)
        continue
      }

      await uploadToSignedUrlAction(
        signedUrlConfig.path,
        signedUrlConfig.token,
        file,
      )
      successfulUploads.push({ file, signedUrlConfig })
    }

    return successfulUploads
  }

  const { mutate: processUploads } = trpc.uploads.process.useMutation({
    onMutate: () => {
      toast.loading('Processing bank statements...', {
        id: 'upload-bank-statement',
        description: null,
      })
    },
    onError: (error) => {
      toast.error(error.message, {
        id: 'upload-bank-statement',
        description: null,
      })
    },
    onSuccess: () => {
      toast.success('Bank statements uploaded successfully', {
        id: 'upload-bank-statement',
        description:
          'You will be notified via email when an update about the processing is available.',
      })
      refetchUploads()
      router.push('/uploads')
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = event.target.files

    if (newFiles && newFiles.length > 0) {
      const filesArray = Array.from(newFiles)
      setFiles(filesArray)
      createSignedUploadUrls({
        fileNames: filesArray.map((file) => file.name),
      })
    }

    event.target.value = ''
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        min={1}
        max={10}
        accept=".pdf"
        className="hidden"
      />
      <Button onClick={handleUploadClick} disabled={isUploading}>
        New upload
        <Kbd variant="default" className="-mr-2">
          {NEW_UPLOAD_SHORTCUT}
        </Kbd>
      </Button>
    </>
  )
}
