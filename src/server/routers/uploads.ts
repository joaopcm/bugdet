import { randomUUID } from 'node:crypto'
import {
  DEFAULT_LIMIT_PER_PAGE,
  MAX_LIMIT_PER_PAGE,
} from '@/constants/pagination'
import { CANCELLABLE_STATUSES, DELETABLE_STATUSES } from '@/constants/uploads'
import { db } from '@/db'
import { transaction, upload } from '@/db/schema'
import { encryptPassword } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { TRPCError } from '@trpc/server'
import { and, desc, eq, ilike, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

async function getExistingUpload(id: string, tenantId: string) {
  const [existingUpload] = await db
    .select({
      id: upload.id,
      deleted: upload.deleted,
      status: upload.status,
      filePath: upload.filePath,
      pageCount: upload.pageCount,
      pdfDeleted: upload.pdfDeleted,
      retryCount: upload.retryCount,
    })
    .from(upload)
    .where(and(eq(upload.id, id), eq(upload.tenantId, tenantId)))

  if (!existingUpload || existingUpload.deleted) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Upload not found.',
    })
  }

  return existingUpload
}

function getPageImagePaths(
  uploadId: string,
  pageCount: number | null,
): string[] {
  if (!pageCount || pageCount === 0) return []
  return Array.from(
    { length: pageCount },
    (_, i) => `${uploadId}/page-${i + 1}.png`,
  )
}

export type SignedUploadUrl = {
  signedUrl: string
  token: string
  path: string
  originalFileName: string
}

export const uploadsRouter = router({
  listForFilter: protectedProcedure.query(async ({ ctx }) => {
    const uploads = await ctx.db
      .select({
        id: upload.id,
        fileName: upload.fileName,
        createdAt: upload.createdAt,
      })
      .from(upload)
      .where(
        and(
          eq(upload.tenantId, ctx.tenant.tenantId),
          eq(upload.deleted, false),
          eq(upload.status, 'completed'),
        ),
      )
      .orderBy(desc(upload.createdAt))

    return { data: uploads }
  }),
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
            tenantId: ctx.tenant.tenantId,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
          })),
        )
        .returning({
          id: upload.id,
        })

      await tasks.batchTrigger(
        'upload-breakdown',
        newUploads.map((u) => ({
          payload: {
            uploadId: u.id,
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
        eq(upload.tenantId, ctx.tenant.tenantId),
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
          pdfDeleted: upload.pdfDeleted,
          retryCount: upload.retryCount,
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

      const existingUpload = await getExistingUpload(id, ctx.tenant.tenantId)

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
  retry: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input

      const existingUpload = await getExistingUpload(id, ctx.tenant.tenantId)

      if (existingUpload.status !== 'failed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only failed uploads can be retried.',
        })
      }

      if (existingUpload.pdfDeleted) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot retry: original PDF has been deleted.',
        })
      }

      if (existingUpload.retryCount >= 3) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum retry attempts reached (3).',
        })
      }

      const supabase = await createClient({ admin: true })

      const pageImagePaths = getPageImagePaths(
        existingUpload.id,
        existingUpload.pageCount,
      )
      if (pageImagePaths.length > 0) {
        await supabase.storage.from('bank-statements').remove(pageImagePaths)
      }

      await ctx.db
        .update(upload)
        .set({
          status: 'queued',
          failedReason: null,
          pageCount: null,
          metadata: null,
          retryCount: existingUpload.retryCount + 1,
        })
        .where(eq(upload.id, existingUpload.id))

      await tasks.trigger('upload-breakdown', { uploadId: existingUpload.id })

      return { success: true }
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

      const existingUpload = await getExistingUpload(id, ctx.tenant.tenantId)

      if (!DELETABLE_STATUSES.includes(existingUpload.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Upload is not deletable.',
        })
      }

      const supabase = await createClient({ admin: true })

      const pageImagePaths = getPageImagePaths(
        existingUpload.id,
        existingUpload.pageCount,
      )
      const { error: deleteFileError } = await supabase.storage
        .from('bank-statements')
        .remove([existingUpload.filePath, ...pageImagePaths])

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
              eq(upload.tenantId, ctx.tenant.tenantId),
            ),
          )

        if (input.deleteRelatedTransactions) {
          await tx
            .update(transaction)
            .set({ deleted: true })
            .where(
              and(
                eq(transaction.uploadId, existingUpload.id),
                eq(transaction.tenantId, ctx.tenant.tenantId),
              ),
            )
        }
      })
    }),
  deleteMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1).max(100),
        deleteRelatedTransactions: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uploadsToDelete = await ctx.db
        .select({
          id: upload.id,
          filePath: upload.filePath,
          pageCount: upload.pageCount,
        })
        .from(upload)
        .where(
          and(
            inArray(upload.id, input.ids),
            eq(upload.tenantId, ctx.tenant.tenantId),
            eq(upload.deleted, false),
            inArray(upload.status, DELETABLE_STATUSES),
          ),
        )

      if (uploadsToDelete.length === 0) {
        return { deletedCount: 0 }
      }

      const supabase = await createClient({ admin: true })
      const filesToDelete = uploadsToDelete.flatMap((u) => [
        u.filePath,
        ...getPageImagePaths(u.id, u.pageCount),
      ])
      await supabase.storage.from('bank-statements').remove(filesToDelete)

      // Soft delete uploads and optionally transactions
      const uploadIds = uploadsToDelete.map((u) => u.id)

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(upload)
          .set({ deleted: true })
          .where(
            and(
              inArray(upload.id, uploadIds),
              eq(upload.tenantId, ctx.tenant.tenantId),
            ),
          )

        if (input.deleteRelatedTransactions) {
          await tx
            .update(transaction)
            .set({ deleted: true })
            .where(
              and(
                inArray(transaction.uploadId, uploadIds),
                eq(transaction.tenantId, ctx.tenant.tenantId),
              ),
            )
        }
      })

      return { deletedCount: uploadsToDelete.length }
    }),
  setPassword: protectedProcedure
    .input(
      z.object({
        uploadId: z.string().uuid(),
        password: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { uploadId, password } = input

      const [existingUpload] = await ctx.db
        .select({
          id: upload.id,
          status: upload.status,
          deleted: upload.deleted,
        })
        .from(upload)
        .where(
          and(
            eq(upload.id, uploadId),
            eq(upload.tenantId, ctx.tenant.tenantId),
          ),
        )

      if (!existingUpload || existingUpload.deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Upload not found.',
        })
      }

      if (existingUpload.status !== 'waiting_for_password') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Upload is not waiting for a password.',
        })
      }

      const encrypted = encryptPassword(password)

      await ctx.db
        .update(upload)
        .set({
          encryptedPassword: encrypted,
          status: 'queued',
        })
        .where(
          and(
            eq(upload.id, uploadId),
            eq(upload.tenantId, ctx.tenant.tenantId),
          ),
        )

      await tasks.trigger('upload-breakdown', { uploadId })

      return { success: true }
    }),
  getLatestUploadDate: protectedProcedure.query(async ({ ctx }) => {
    const [latestUpload] = await ctx.db
      .select({
        createdAt: upload.createdAt,
      })
      .from(upload)
      .where(
        and(
          eq(upload.tenantId, ctx.tenant.tenantId),
          eq(upload.deleted, false),
        ),
      )
      .orderBy(desc(upload.createdAt))
      .limit(1)

    return {
      latestUploadDate: latestUpload?.createdAt ?? null,
    }
  }),
})
