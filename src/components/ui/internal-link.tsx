import Link from 'next/link'

export function InternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="hover:cursor-pointer underline decoration-dashed underline-offset-2 hover:decoration-muted-foreground hover:text-muted-foreground transition-colors"
    >
      {children}
    </Link>
  )
}
