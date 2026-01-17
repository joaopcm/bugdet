import Image from "next/image";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Image alt="Empty state" height={90} src="/images/empty.png" width={90} />
      <h3 className="font-semibold text-xl">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
