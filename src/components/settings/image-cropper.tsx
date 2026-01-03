'use client'

import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { IconMinus, IconPlus } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedAreaPixels: Area) => void
  className?: string
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  className,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete(croppedAreaPixels)
    },
    [onCropComplete],
  )

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="flex items-center gap-3">
        <IconMinus className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.1}
          onValueChange={([value]) => setZoom(value)}
          className="flex-1"
        />
        <IconPlus className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
