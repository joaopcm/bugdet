import { serverClient } from '@/lib/trpc/server'

export default async function Home() {
  const greeting = await serverClient.greeting()

  return (
    <main>
      <div>{JSON.stringify(greeting)}</div>
    </main>
  )
}
