"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadToSignedUrlAction(
  fileName: string,
  token: string,
  file: File
) {
  const supabase = await createClient({ admin: true });

  const { data, error } = await supabase.storage
    .from("bank-statements")
    .uploadToSignedUrl(fileName, token, file);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
