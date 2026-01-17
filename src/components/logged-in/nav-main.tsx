"use client";

import type { Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInvalidateUploads } from "@/hooks/use-uploads";
import { trpc } from "@/lib/trpc/client";
import { uploadToSignedUrlAction } from "@/server/actions/uploads";
import type { SignedUploadUrl } from "@/server/routers/uploads";
import { Kbd } from "../ui/kbd";

const IMPORT_BANK_STATEMENT_SHORTCUT = "I";

interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function NavMain({
  items,
  fileInputRef: externalFileInputRef,
}: NavMainProps) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const internalFileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = externalFileInputRef ?? internalFileInputRef;
  const invalidate = useInvalidateUploads();

  useHotkeys(IMPORT_BANK_STATEMENT_SHORTCUT, () => handleImportClick());

  const { mutate: createSignedUploadUrls } =
    trpc.uploads.createSignedUploadUrls.useMutation({
      onMutate: () => {
        setIsUploading(true);
        toast.loading("Preparing bank statements upload...", {
          id: "upload-bank-statement",
          description: null,
        });
      },
      onError: (error) => {
        setIsUploading(false);
        toast.error(error.message, {
          id: "upload-bank-statement",
          description: null,
        });
      },
      onSuccess: async ({ uploadUrls }) => {
        const successfulUploads = await uploadToSignedUrls(uploadUrls);
        processUploads({
          files: successfulUploads.map((upload) => ({
            fileSize: upload.file.size,
            fileName: upload.file.name,
            filePath: upload.signedUrlConfig.path,
          })),
        });
        setFiles(null);
      },
    });

  async function uploadToSignedUrls(configs: SignedUploadUrl[]) {
    if (!files) {
      throw new Error("No files to upload.");
    }

    const fileNameToSignedUrlConfigMap = new Map<string, SignedUploadUrl>();
    for (const config of configs) {
      fileNameToSignedUrlConfigMap.set(config.originalFileName, config);
    }

    toast.loading("Uploading bank statements...", {
      id: "upload-bank-statement",
      description: null,
    });

    const successfulUploads: {
      file: File;
      signedUrlConfig: SignedUploadUrl;
    }[] = [];

    for (const file of files) {
      const signedUrlConfig = fileNameToSignedUrlConfigMap.get(file.name);

      if (!signedUrlConfig) {
        toast.error(`Failed to upload "${file.name}".`);
        continue;
      }

      await uploadToSignedUrlAction(
        signedUrlConfig.path,
        signedUrlConfig.token,
        file
      );
      successfulUploads.push({ file, signedUrlConfig });
    }

    return successfulUploads;
  }

  const { mutate: processUploads } = trpc.uploads.process.useMutation({
    onMutate: () => {
      toast.loading("Processing bank statements...", {
        id: "upload-bank-statement",
        description: null,
      });
    },
    onError: (error) => {
      toast.error(error.message, {
        id: "upload-bank-statement",
        description: null,
      });
    },
    onSuccess: () => {
      toast.success("Bank statements uploaded successfully", {
        id: "upload-bank-statement",
        description:
          "You will be notified via email when an update about the processing is available.",
      });
      invalidate();
      router.push("/uploads");
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = event.target.files;

    if (newFiles && newFiles.length > 0) {
      const filesArray = Array.from(newFiles);
      setFiles(filesArray);
      createSignedUploadUrls({
        fileNames: filesArray.map((file) => file.name),
      });
    }

    event.target.value = "";
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <input
              accept=".pdf"
              className="hidden"
              id="bank-statement-upload"
              max={10}
              min={1}
              multiple
              onChange={handleFileSelect}
              ref={fileInputRef}
              type="file"
            />
            <Button
              className="flex-1"
              disabled={isUploading}
              onClick={handleImportClick}
            >
              Import bank statement
              <Kbd className="-mr-2" variant="default">
                {IMPORT_BANK_STATEMENT_SHORTCUT}
              </Kbd>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu className="mt-2">
          {items.map((item) => (
            <Link href={item.url} key={item.title} prefetch>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                  data-active={pathname === item.url}
                  tooltip={item.title}
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
  );
}
