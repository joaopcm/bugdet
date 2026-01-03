import { randomUUID } from 'node:crypto'
import {
  ALLOWED_PROFILE_PICTURE_TYPES,
  MAX_PROFILE_PICTURE_SIZE,
  PROFILE_PICTURES_BUCKET,
} from '@/constants/profile-pictures'
import { db } from '@/db'
import { user } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return mimeToExt[mimeType] || 'jpg'
}

export type ProfilePictureUploadUrl = {
  signedUrl: string
  token: string
  path: string
}

export const usersRouter = router({
  createProfilePictureUploadUrl: protectedProcedure
    .input(
      z.object({
        fileType: z.enum(ALLOWED_PROFILE_PICTURE_TYPES),
        fileSize: z
          .number()
          .max(MAX_PROFILE_PICTURE_SIZE, 'File size must be less than 5MB'),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<ProfilePictureUploadUrl> => {
      const supabase = await createClient({ admin: true })

      const [currentUser] = await db
        .select({ image: user.image })
        .from(user)
        .where(eq(user.id, ctx.user.id))

      if (currentUser?.image) {
        const existingPath = currentUser.image.includes(PROFILE_PICTURES_BUCKET)
          ? currentUser.image.split(`${PROFILE_PICTURES_BUCKET}/`)[1]
          : null

        if (existingPath) {
          await supabase.storage
            .from(PROFILE_PICTURES_BUCKET)
            .remove([existingPath])
        }
      }

      const extension = getExtensionFromMimeType(input.fileType)
      const uniqueFileName = `${ctx.user.id}/${randomUUID()}.${extension}`

      const { data: uploadUrl, error: uploadUrlError } = await supabase.storage
        .from(PROFILE_PICTURES_BUCKET)
        .createSignedUploadUrl(uniqueFileName, {
          upsert: true,
        })

      if (uploadUrlError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create signed upload URL: ${uploadUrlError.message}`,
        })
      }

      return {
        signedUrl: uploadUrl.signedUrl,
        token: uploadUrl.token,
        path: uploadUrl.path,
      }
    }),

  updateProfilePicture: protectedProcedure
    .input(
      z.object({
        filePath: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = await createClient({ admin: true })

      const { data: publicUrlData } = supabase.storage
        .from(PROFILE_PICTURES_BUCKET)
        .getPublicUrl(input.filePath)

      if (!publicUrlData?.publicUrl) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get public URL for profile picture',
        })
      }

      await db
        .update(user)
        .set({
          image: publicUrlData.publicUrl,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.user.id))

      return {
        imageUrl: publicUrlData.publicUrl,
      }
    }),

  removeProfilePicture: protectedProcedure.mutation(async ({ ctx }) => {
    const supabase = await createClient({ admin: true })

    const [currentUser] = await db
      .select({ image: user.image })
      .from(user)
      .where(eq(user.id, ctx.user.id))

    if (!currentUser?.image) {
      return { success: true }
    }

    const existingPath = currentUser.image.includes(PROFILE_PICTURES_BUCKET)
      ? currentUser.image.split(`${PROFILE_PICTURES_BUCKET}/`)[1]
      : null

    if (existingPath) {
      const { error: deleteError } = await supabase.storage
        .from(PROFILE_PICTURES_BUCKET)
        .remove([existingPath])

      if (deleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete profile picture: ${deleteError.message}`,
        })
      }
    }

    await db
      .update(user)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, ctx.user.id))

    return { success: true }
  }),
})
