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
import { type Icon, IconLoader2 } from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useRef } from 'react'
import { toast } from 'sonner'

interface NavMainProps {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refetch: refetchUploads } = useUploads()

  const { mutate: uploadBankStatement, isPending } =
    trpc.uploads.upload.useMutation({
      onError: (error) => {
        toast.error(error.message)
      },
      onSuccess: () => {
        refetchUploads()
        router.push('/uploads')
      },
    })

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (files && files.length > 0) {
      const fileArray = Array.from(files)
      const fileData = []

      for (const file of fileArray) {
        fileData.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: await file.text(),
        })
      }

      uploadBankStatement({ files: fileData })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
              max={10}
              min={1}
              accept=".csv,.pdf"
              className="hidden"
            />
            <Button
              className="flex-1"
              onClick={handleImportClick}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <IconLoader2 className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                'Import Bank Statement'
              )}
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
