import { upload } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  content: z.string(),
})

export const bankStatementRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        files: z.array(fileSchema).max(10).min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { files } = input
      const supabase = await createClient({ admin: true })
      const filenames: string[] = []

      for (const fileData of files) {
        try {
          const buffer = Buffer.from(fileData.content, 'base64')
          const timestamp = Date.now()
          const filename = `${timestamp}-${fileData.name}`

          const { data, error } = await supabase.storage
            .from('bank-statements')
            .upload(filename, buffer, {
              contentType: fileData.type,
            })

          if (error) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to upload ${fileData.name}: ${error.message}`,
            })
          }

          if (data) {
            filenames.push(data.path)
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
        filenames.map((url) => ({
          userId: ctx.user.id,
          filename: url,
        })),
      )

      return {
        urls: filenames,
      }
    }),
})
