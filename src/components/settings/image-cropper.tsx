"use client";

import { IconMinus, IconPlus } from "@tabler/icons-react";
import { useCallback, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: Area) => void;
  className?: string;
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  className,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete(croppedAreaPixels);
    },
    [onCropComplete]
  );

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
        <Cropper
          aspect={1}
          crop={crop}
          cropShape="round"
          image={imageSrc}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
          showGrid={false}
          zoom={zoom}
        />
      </div>
      <div className="flex items-center gap-3">
        <IconMinus className="h-4 w-4 text-muted-foreground" />
        <Slider
          className="flex-1"
          max={3}
          min={1}
          onValueChange={([value]) => setZoom(value)}
          step={0.1}
          value={[zoom]}
        />
        <IconPlus className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
