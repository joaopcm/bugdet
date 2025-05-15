import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import { type FileRouter, createUploadthing } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

export const fileRouter = {
  bankStatementUploader: f({
    pdf: {
      maxFileSize: '1MB',
      maxFileCount: 10,
      minFileCount: 1,
      acl: 'private',
    },
    text: {
      maxFileSize: '1MB',
      maxFileCount: 10,
      minFileCount: 1,
      acl: 'private',
    },
  })
    .middleware(async ({ req }) => {
      const authentication = await auth.api.getSession({
        headers: await headers(),
      })

      if (!authentication) {
        throw new UploadThingError('Unauthorized')
      }

      return { userId: authentication.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId)
      console.log('File url:', file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof fileRouter
