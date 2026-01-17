"use client";

import imageCompression from "browser-image-compression";
import type { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

/**
 * Creates a cropped image from source using canvas
 */
export async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2D context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas is empty"));
        }
      },
      "image/webp",
      0.95
    );
  });
}

/**
 * Compresses and resizes an image to WebP format
 */
export function compressImage(
  file: File | Blob,
  maxSizeMB = 0.2,
  maxWidthOrHeight = 512
): Promise<File> {
  const fileToCompress =
    file instanceof File
      ? file
      : new File([file], "cropped.webp", { type: "image/webp" });

  return imageCompression(fileToCompress, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: "image/webp",
  });
}
