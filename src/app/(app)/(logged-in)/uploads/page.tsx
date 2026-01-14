import { PageLayout } from '@/components/logged-in/page-layout'
import { NewUploadButton } from '@/components/logged-in/uploads/new-upload-button'
import { RefreshButton } from '@/components/logged-in/uploads/refresh-button'
import { UploadsTable } from '@/components/logged-in/uploads/uploads-table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uploads',
}

export default function UploadsPage() {
  return (
    <PageLayout.Root>
      <PageLayout.Header>
        <PageLayout.HeaderContent>
          <PageLayout.HeaderTitle title="Uploads" />
          <PageLayout.HeaderDescription description="Upload, manage, and view your bank statements uploaded to the platform." />
        </PageLayout.HeaderContent>

        <div className="flex items-center gap-2">
          <NewUploadButton />
          <RefreshButton />
        </div>
      </PageLayout.Header>
      <UploadsTable />
    </PageLayout.Root>
  )
}
