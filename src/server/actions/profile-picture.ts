'use server'

import { PROFILE_PICTURES_BUCKET } from '@/constants/profile-pictures'
import { createClient } from '@/lib/supabase/server'

export async function uploadProfilePictureAction(
  fileName: string,
  token: string,
  file: File,
) {
  const supabase = await createClient({ admin: true })

  const { data, error } = await supabase.storage
    .from(PROFILE_PICTURES_BUCKET)
    .uploadToSignedUrl(fileName, token, file)

  if (error) {
    throw new Error(error.message)
  }

  return data
}
