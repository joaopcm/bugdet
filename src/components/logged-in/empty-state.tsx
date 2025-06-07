import Image from 'next/image'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Image src="/images/empty.png" alt="Empty state" width={90} height={90} />
      <h3 className="text-xl font-semibold">No uploads found.</h3>
      <p className="text-muted-foreground text-sm">
        Upload your bank statements to get started.
      </p>
    </div>
  )
}
