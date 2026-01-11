import { type PdfPageImage, convertPdfToImages } from '@/lib/pdf'
import { createLambdaClient } from '@/lib/supabase/server'
import { getBankStatementPresignedUrlTask } from '@/trigger/ai/get-bank-statement-presigned-url'
import { AbortTaskRunError, logger, retry } from '@trigger.dev/sdk/v3'

export type PageImage = {
  page: number
  base64: string
  mimeType: 'image/png'
}

export async function getPageImageUrls(
  uploadId: string,
  pageRange: { start: number; end: number } | 'all',
  pageCount: number,
): Promise<string[]> {
  const supabase = createLambdaClient()

  const pagesToFetch =
    pageRange === 'all'
      ? Array.from({ length: pageCount }, (_, i) => i + 1)
      : Array.from(
          { length: Math.min(pageRange.end, pageCount) - pageRange.start + 1 },
          (_, i) => pageRange.start + i,
        )

  const urls = await Promise.all(
    pagesToFetch.map(async (page) => {
      const path = `${uploadId}/page-${page}.png`
      const { data } = await supabase.storage
        .from('bank-statements')
        .createSignedUrl(path, 60 * 15)
      return data?.signedUrl
    }),
  )

  return urls.filter((url): url is string => url !== undefined)
}

export async function fetchPageImages(
  uploadId: string,
  pageRange: { start: number; end: number } | 'all',
  pageCount: number,
): Promise<PageImage[]> {
  const urls = await getPageImageUrls(uploadId, pageRange, pageCount)

  const images = await Promise.all(
    urls.map(async (url, index) => {
      const response = await retry.fetch(url)
      const buffer = await response.arrayBuffer()
      const page =
        pageRange === 'all'
          ? index + 1
          : (pageRange as { start: number }).start + index

      return {
        page,
        base64: Buffer.from(buffer).toString('base64'),
        mimeType: 'image/png' as const,
      }
    }),
  )

  return images
}

export async function checkImagesExist(
  uploadId: string,
  pageCount?: number,
): Promise<boolean> {
  if (!pageCount || pageCount === 0) {
    return false
  }

  const supabase = createLambdaClient()

  const { data, error } = await supabase.storage
    .from('bank-statements')
    .createSignedUrl(`${uploadId}/page-1.png`, 60)

  return !error && !!data?.signedUrl
}

async function fetchImagesFromPdf(uploadId: string): Promise<PdfPageImage[]> {
  const presignedUrl = await getBankStatementPresignedUrlTask
    .triggerAndWait({ uploadId })
    .unwrap()

  if (!presignedUrl.url) {
    throw new AbortTaskRunError(
      `Failed to get presigned URL for upload ${uploadId}`,
    )
  }

  logger.info(
    `Downloading bank statement for upload ${uploadId} via presigned URL...`,
  )
  const response = await retry.fetch(presignedUrl.url, { method: 'GET' })
  const fileBuffer = await response.arrayBuffer()

  logger.info('Converting PDF to images (lazy migration fallback)...')
  return convertPdfToImages(fileBuffer)
}

export async function getUploadImages(
  uploadId: string,
  pageRange: { start: number; end: number } | 'all',
  pageCount?: number,
): Promise<(PdfPageImage | PageImage)[]> {
  const hasStoredImages = await checkImagesExist(uploadId, pageCount)

  if (hasStoredImages && pageCount) {
    logger.info('Fetching pre-converted images from storage...')
    const images = await fetchPageImages(uploadId, pageRange, pageCount)
    logger.info(`Fetched ${images.length} images from storage`)
    return images
  }

  logger.info('Images not found, falling back to PDF conversion...')
  const images = await fetchImagesFromPdf(uploadId)
  logger.info(`Converted ${images.length} pages to images`)
  return images
}
