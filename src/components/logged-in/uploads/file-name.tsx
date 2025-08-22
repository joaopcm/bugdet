import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { UploadMetadata } from '@/db/schema'

interface FileNameProps {
  fileName: string
  metadata: UploadMetadata | null
}

export function FileName({ fileName, metadata }: FileNameProps) {
  if (metadata) {
    return (
      <Tooltip>
        <TooltipTrigger className="cursor-pointer underline decoration-dashed underline-offset-2">
          {fileName}
        </TooltipTrigger>
        <TooltipContent side="right">
          <ul className="grid gap-3 text-xs">
            {metadata.documentType && (
              <MetadataField
                label="Document Type"
                value={metadata.documentType}
              />
            )}

            {metadata.bankName && (
              <MetadataField label="Bank Name" value={metadata.bankName} />
            )}

            {metadata.statementPeriod?.startDate && (
              <MetadataField
                label="Statement Period Start Date"
                value={metadata.statementPeriod.startDate}
              />
            )}

            {metadata.statementPeriod?.endDate && (
              <MetadataField
                label="Statement Period End Date"
                value={metadata.statementPeriod.endDate}
              />
            )}

            {metadata.extraInformation &&
              metadata.extraInformation.length > 0 &&
              metadata.extraInformation.map((info) => (
                <MetadataField
                  key={info.key}
                  label={info.key}
                  value={info.value}
                />
              ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    )
  }

  return <>{fileName}</>
}

interface MetadataFieldProps {
  label: string
  value: string
}

function MetadataField({ label, value }: MetadataFieldProps) {
  return (
    <li className="grid gap-0.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  )
}
