import { Badge } from "@/components/ui/badge";
import { CONFIDENCE_THRESHOLD } from "@/constants/transactions";

interface CategoryProps {
  categoryName: string | null;
  confidence: number;
}

export function Category({ categoryName, confidence }: CategoryProps) {
  if (!categoryName) {
    return (
      <Badge className="select-none" variant="outline">
        Uncategorized
      </Badge>
    );
  }

  const isLowConfidence = confidence < CONFIDENCE_THRESHOLD;

  return (
    <Badge
      className="select-none"
      variant={isLowConfidence ? "secondary" : "default"}
    >
      {categoryName}
    </Badge>
  );
}
