import { randomUUID } from 'node:crypto'
import {
  DEFAULT_LIMIT_PER_PAGE,
  MAX_LIMIT_PER_PAGE,
} from '@/constants/pagination'
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from '@/constants/uploads'
import { db } from '@/db'
import { transaction, upload } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { uploadBreakdownTask } from '@/trigger/ai/upload-breakdown'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

async function getExistingUpload(id: string, userId: string) {
  const [existingUpload] = await db
    .select({
      id: upload.id,
      deleted: upload.deleted,
      status: upload.status,
      filePath: upload.filePath,
    })
    .from(upload)
    .where(and(eq(upload.id, id), eq(upload.userId, userId)))

  if (!existingUpload || existingUpload.deleted) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Upload not found.',
    })
  }

  return existingUpload
}

export type SignedUploadUrl = {
  signedUrl: string
  token: string
  path: string
  originalFileName: string
}

export const uploadsRouter = router({
  createSignedUploadUrls: protectedProcedure
    .input(z.object({ fileNames: z.array(z.string()).min(1).max(10) }))
    .mutation(async ({ input }) => {
      const supabase = await createClient({ admin: true })
      const uploadUrls: SignedUploadUrl[] = []

      for (const fileName of input.fileNames) {
        const extension = fileName.split('.').pop()
        const uniqueFileName = `${randomUUID()}.${extension}`
        const { data: uploadUrl, error: uploadUrlError } =
          await supabase.storage
            .from('bank-statements')
            .createSignedUploadUrl(uniqueFileName, {
              upsert: true,
            })

        if (uploadUrlError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create signed upload url for ${fileName}: ${uploadUrlError.message}`,
          })
        }

        uploadUrls.push({
          ...uploadUrl,
          originalFileName: fileName,
        })
      }

      return {
        uploadUrls,
      }
    }),
  process: protectedProcedure
    .input(
      z.object({
        files: z
          .array(
            z.object({
              fileName: z.string(),
              fileSize: z.number(),
              filePath: z.string(),
            }),
          )
          .max(10)
          .min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { files } = input

      const newUploads = await ctx.db
        .insert(upload)
        .values(
          files.map((file) => ({
            userId: ctx.user.id,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
          })),
        )
        .returning({
          id: upload.id,
        })

      await uploadBreakdownTask.batchTrigger(
        newUploads.map((upload) => ({
          payload: {
            uploadId: upload.id,
          },
        })),
      )
    }),
  list: protectedProcedure
    .input(
      z.object({
        filters: z.object({
          query: z.string().min(1).max(255).nullable(),
        }),
        pagination: z.object({
          page: z.number().min(1).default(1),
          limit: z
            .number()
            .min(1)
            .max(MAX_LIMIT_PER_PAGE)
            .default(DEFAULT_LIMIT_PER_PAGE),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClauses = [
        eq(upload.userId, ctx.user.id),
        eq(upload.deleted, false),
      ]

      if (input.filters.query) {
        whereClauses.push(ilike(upload.fileName, `%${input.filters.query}%`))
      }

      const offset = (input.pagination.page - 1) * input.pagination.limit

      const uploads = await db
        .select({
          id: upload.id,
          fileName: upload.fileName,
          filePath: upload.filePath,
          fileSize: upload.fileSize,
          status: upload.status,
          failedReason: upload.failedReason,
          metadata: upload.metadata,
          createdAt: upload.createdAt,
        })
        .from(upload)
        .where(and(...whereClauses))
        .orderBy(desc(upload.createdAt))
        .limit(input.pagination.limit + 1)
        .offset(offset)

      return {
        data: uploads.slice(0, input.pagination.limit),
        hasMore: uploads.length > input.pagination.limit,
      }
    }),
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input

      const existingUpload = await getExistingUpload(id, ctx.user.id)

      if (!CANCELLABLE_STATUSES.includes(existingUpload.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Upload is not cancellable.',
        })
      }

      await ctx.db
        .update(upload)
        .set({ status: 'cancelled' })
        .where(eq(upload.id, existingUpload.id))
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        deleteRelatedTransactions: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id } = input

      const existingUpload = await getExistingUpload(id, ctx.user.id)

      if (!DELETABLE_STATUSES.includes(existingUpload.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Upload is not deletable.',
        })
      }

      const supabase = await createClient({ admin: true })

      const { error: deleteFileError } = await supabase.storage
        .from('bank-statements')
        .remove([existingUpload.filePath])

      if (deleteFileError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete ${existingUpload.filePath}: ${deleteFileError.message}`,
        })
      }

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(upload)
          .set({ deleted: true })
          .where(
            and(
              eq(upload.id, existingUpload.id),
              eq(upload.userId, ctx.user.id),
            ),
          )

        if (input.deleteRelatedTransactions) {
          await tx
            .update(transaction)
            .set({ deleted: true })
            .where(
              and(
                eq(transaction.uploadId, existingUpload.id),
                eq(transaction.userId, ctx.user.id),
              ),
            )
        }
      })
    }),
  download: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input

      const existingUpload = await getExistingUpload(id, ctx.user.id)

      const supabase = await createClient({ admin: true })

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from('bank-statements')
          .createSignedUrl(existingUpload.filePath, 60 * 15) // 15 minutes

      if (signedUrlError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to download ${existingUpload.filePath}: ${signedUrlError.message}`,
        })
      }

      return {
        url: signedUrlData.signedUrl,
      }
    }),
})
