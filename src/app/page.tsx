'use client'

import { trpc } from '@/lib/trpc/client'

export default function Home() {
  const greeting = trpc.greeting.useQuery()

  return (
    <main>
      <div>{JSON.stringify(greeting.data)}</div>
    </main>
  )
}
