import { Badge } from '@/components/ui/badge'

interface CategoryProps {
  categoryName: string | null
}

export function Category({ categoryName }: CategoryProps) {
  if (!categoryName) {
    return (
      <Badge variant="outline" className="select-none">
        Uncategorized
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="select-none">
      {categoryName}
    </Badge>
  )
}
