import { randomUUID } from 'node:crypto'
import { db } from '@/db'
import { upload } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { TRPCError } from '@trpc/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  content: z.string(),
})

export const uploadsRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        files: z.array(fileSchema).max(10).min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { files } = input
      const supabase = await createClient({ admin: true })
      const processedFiles: {
        name: string
        path: string
        size: number
      }[] = []

      for (const fileData of files) {
        try {
          const buffer = Buffer.from(fileData.content, 'base64')
          const fileName = fileData.name
          const fileExtension = fileName.split('.').pop()
          const filePath = `${randomUUID()}.${fileExtension}`
          const fileSize = fileData.size

          const { data, error } = await supabase.storage
            .from('bank-statements')
            .upload(filePath, buffer, {
              contentType: fileData.type,
            })

          if (error) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to upload ${fileData.name}: ${error.message}`,
            })
          }

          if (data) {
            processedFiles.push({
              name: fileName,
              path: data.path,
              size: fileSize,
            })
          }
        } catch (error) {
          console.error(error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to process ${fileData.name}`,
          })
        }
      }

      await ctx.db.insert(upload).values(
        processedFiles.map((file) => ({
          userId: ctx.user.id,
          fileName: file.name,
          filePath: file.path,
          fileSize: file.size,
        })),
      )

      return {
        urls: processedFiles,
      }
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const uploads = await db
      .select({
        id: upload.id,
        fileName: upload.fileName,
        filePath: upload.filePath,
        fileSize: upload.fileSize,
        status: upload.status,
        createdAt: upload.createdAt,
      })
      .from(upload)
      .where(eq(upload.userId, ctx.user.id))
      .orderBy(desc(upload.createdAt))

    return uploads
  }),
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input

      const [existingUpload] = await ctx.db
        .select({ id: upload.id, status: upload.status })
        .from(upload)
        .where(and(eq(upload.id, id), eq(upload.userId, ctx.user.id)))

      if (!existingUpload) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Upload not found.',
        })
      }

      if (
        existingUpload.status !== 'queued' &&
        existingUpload.status !== 'processing'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Upload is not cancellable.',
        })
      }

      await ctx.db
        .update(upload)
        .set({ status: 'cancelled' })
        .where(eq(upload.id, id))
    }),
})
