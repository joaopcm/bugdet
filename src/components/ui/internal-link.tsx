import Link from "next/link";

export function InternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      className="underline decoration-dashed underline-offset-2 transition-colors hover:cursor-pointer hover:text-muted-foreground hover:decoration-muted-foreground"
      href={href}
    >
      {children}
    </Link>
  );
}
