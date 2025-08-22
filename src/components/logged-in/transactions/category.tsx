import { Badge } from '@/components/ui/badge'
import { CONFIDENCE_THRESHOLD } from '@/constants/transactions'

interface CategoryProps {
  categoryName: string | null
  confidence: number
}

export function Category({ categoryName, confidence }: CategoryProps) {
  if (!categoryName) {
    return (
      <Badge variant="outline" className="select-none">
        Uncategorized
      </Badge>
    )
  }

  const isLowConfidence = confidence < CONFIDENCE_THRESHOLD

  return (
    <Badge
      variant={isLowConfidence ? 'secondary' : 'default'}
      className="select-none"
    >
      {categoryName}
    </Badge>
  )
}
