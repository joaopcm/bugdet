import { env } from '@/env'
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

interface CreateClientProps {
  admin?: boolean
}

export async function createClient({ admin }: CreateClientProps = {}) {
  const cookieStore = await cookies()

  return createServerClient(
    env.SUPABASE_URL,
    admin ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
              })
            }
          } catch (error) {
            console.error(error)
          }
        },
      },
    },
  )
}

export function createLambdaClient() {
  return createSupabaseClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
}
