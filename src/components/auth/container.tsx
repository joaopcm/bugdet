import { env } from '@/env'
import Image from 'next/image'
import Link from 'next/link'
import type { PropsWithChildren } from 'react'
import { Card, CardContent } from '../ui/card'

interface AuthContainerProps extends PropsWithChildren {
  imageSource?: string
}

export function AuthContainer({
  children,
  imageSource = '/free-user.png',
}: AuthContainerProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {children}

          <div className="bg-muted relative hidden md:block">
            <Image
              priority
              src={imageSource}
              alt="Side illustration"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              width={500}
              height={500}
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs text-balance *:[a]:hover:text-primary *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{' '}
        <Link href={`${env.NEXT_PUBLIC_APP_URL}/terms-of-service`}>
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href={`${env.NEXT_PUBLIC_APP_URL}/privacy-policy`}>
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  )
}

interface AuthContainerHeaderProps {
  title: string
  description: string
}

export function AuthContainerHeader({
  title,
  description,
}: AuthContainerHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-balance">{description}</p>
    </div>
  )
}
