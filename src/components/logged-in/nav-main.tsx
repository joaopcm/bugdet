'use client'

import { Button } from '@/components/ui/button'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useUploads } from '@/hooks/use-uploads'
import { trpc } from '@/lib/trpc/client'
import { uploadToSignedUrlAction } from '@/server/actions/uploads'
import type { SignedUploadUrl } from '@/server/routers/uploads'
import type { Icon } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}

export function NavMain({ items }: NavMainProps) {
  const [files, setFiles] = useState<FileList | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refetch: refetchUploads } = useUploads()

  const {
    mutate: createSignedUploadUrls,
    isPending: isCreatingSignedUploadUrls,
  } = trpc.uploads.createSignedUploadUrls.useMutation({
    onMutate: () => {
      toast.loading('Preparing bank statement upload...', {
        id: 'upload-bank-statement',
      })
    },
    onError: (error) => {
      toast.error(error.message, {
        id: 'upload-bank-statement',
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
    },
  })

  async function uploadToSignedUrls(configs: SignedUploadUrl[]) {
    if (!files) {
      throw new Error('No files to upload')
    }

    const fileNameToSignedUrlConfigMap = new Map<string, SignedUploadUrl>()
    for (const config of configs) {
      fileNameToSignedUrlConfigMap.set(config.originalFileName, config)
    }

    toast.loading('Uploading bank statements...', {
      id: 'upload-bank-statement',
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

  const { mutate: processUploads, isPending: isProcessingUploads } =
    trpc.uploads.process.useMutation({
      onMutate: () => {
        toast.loading('Processing bank statements...', {
          id: 'upload-bank-statement',
        })
      },
      onError: (error) => {
        toast.error(error.message, {
          id: 'upload-bank-statement',
        })
      },
      onSuccess: () => {
        toast.success('Bank statements uploaded successfully', {
          id: 'upload-bank-statement',
        })
        refetchUploads()
        router.push('/uploads')
      },
    })

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = event.target.files

    if (newFiles && newFiles.length > 0) {
      setFiles(newFiles)
      createSignedUploadUrls({
        fileNames: Array.from(newFiles).map((file) => file.name),
      })
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
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
            <Button
              className="flex-1"
              onClick={handleImportClick}
              disabled={isCreatingSignedUploadUrls}
            >
              Import Bank Statement
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-2">
          {items.map((item) => (
            <Link href={item.url} key={item.title} prefetch>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  data-active={pathname === item.url}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
