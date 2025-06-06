import { createClient } from '@/lib/supabase/server'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, router } from '../trpc'

const fileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number(),
  content: z.string(),
})

export const bankStatementRouter = router({
  upload: publicProcedure
    .input(
      z.object({
        files: z.array(fileSchema).max(10).min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { files } = input
      const supabase = await createClient({ admin: true })
      const urls: string[] = []

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
            urls.push(data.path)
          }
        } catch (error) {
          console.error(error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to process ${fileData.name}`,
          })
        }
      }

      return {
        urls,
      }
    }),
})
