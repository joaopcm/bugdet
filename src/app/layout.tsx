import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { PT_Sans } from 'next/font/google'
import './globals.css'
import { fileRouter } from '@/app/api/uploadthing/core'
import TRPCProvider from '@/components/providers/trpc'
import { Toaster } from '@/components/ui/sonner'
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin'
import type { PropsWithChildren } from 'react'
import { extractRouterConfig } from 'uploadthing/server'

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
})

const ptSans = PT_Sans({
  variable: '--font-pt-sans',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Bugdet',
  description: 'Your bank statements. With the ease of AI.',
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${ptSans.variable} antialiased relative`}
      >
        <div className="texture" />
        <TRPCProvider>
          <NextSSRPlugin routerConfig={extractRouterConfig(fileRouter)} />
          <main>{children}</main>
          <Toaster />
        </TRPCProvider>
      </body>
    </html>
  )
}
