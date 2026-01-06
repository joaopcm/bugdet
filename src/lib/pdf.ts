import * as mupdf from 'mupdf'

const MAX_PAGES = 50
const DPI = 150
const SCALE_FACTOR = DPI / 72 // mupdf default is 72 DPI

export type PdfPageImage = {
  page: number
  base64: string
  mimeType: 'image/png'
}

export class PdfPasswordRequiredError extends Error {
  constructor() {
    super('PDF is password protected')
    this.name = 'PdfPasswordRequiredError'
  }
}

export class PdfIncorrectPasswordError extends Error {
  constructor() {
    super('Incorrect PDF password')
    this.name = 'PdfIncorrectPasswordError'
  }
}

export type PdfCheckResult =
  | { encrypted: false }
  | { encrypted: true; needsPassword: true }
  | { encrypted: true; needsPassword: false }

/**
 * Check if a PDF is password-protected
 */
export async function checkPdfPassword(
  data: ArrayBuffer,
  password?: string,
): Promise<PdfCheckResult> {
  try {
    const doc = mupdf.Document.openDocument(
      new Uint8Array(data),
      'application/pdf',
    )

    // Check if document needs a password
    if (doc.needsPassword()) {
      if (password) {
        // Try to authenticate with the provided password
        const authenticated = doc.authenticatePassword(password)
        doc.destroy()

        if (authenticated) {
          return { encrypted: true, needsPassword: false }
        }
        throw new PdfIncorrectPasswordError()
      }

      doc.destroy()
      return { encrypted: true, needsPassword: true }
    }

    doc.destroy()
    return { encrypted: false }
  } catch (error) {
    if (error instanceof PdfIncorrectPasswordError) {
      throw error
    }
    // If mupdf throws during open, it might be password-protected
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('password')
    ) {
      return { encrypted: true, needsPassword: true }
    }
    throw error
  }
}

/**
 * Decrypt a password-protected PDF and return an unencrypted buffer.
 */
export async function decryptPdf(
  data: ArrayBuffer,
  password: string,
): Promise<Uint8Array> {
  const doc = mupdf.Document.openDocument(
    new Uint8Array(data),
    'application/pdf',
  ) as mupdf.PDFDocument

  if (doc.needsPassword()) {
    const authenticated = doc.authenticatePassword(password)
    if (!authenticated) {
      doc.destroy()
      throw new PdfIncorrectPasswordError()
    }
  }

  // Save the document without encryption using saveToBuffer
  const outputBuffer = doc.saveToBuffer('decrypt')
  doc.destroy()

  return outputBuffer.asUint8Array()
}

/**
 * Convert PDF pages to PNG images for vision-based LLM processing.
 * Returns base64-encoded PNG images for each page (up to MAX_PAGES).
 */
export async function convertPdfToImages(
  data: ArrayBuffer,
  password?: string,
): Promise<PdfPageImage[]> {
  const doc = mupdf.Document.openDocument(
    new Uint8Array(data),
    'application/pdf',
  )

  if (doc.needsPassword()) {
    if (!password) {
      doc.destroy()
      throw new PdfPasswordRequiredError()
    }
    const authenticated = doc.authenticatePassword(password)
    if (!authenticated) {
      doc.destroy()
      throw new PdfIncorrectPasswordError()
    }
  }

  const pageCount = Math.min(doc.countPages(), MAX_PAGES)
  const images: PdfPageImage[] = []

  for (let i = 0; i < pageCount; i++) {
    let page: mupdf.Page | undefined
    let pixmap: mupdf.Pixmap | undefined

    try {
      page = doc.loadPage(i)
      pixmap = page.toPixmap(
        mupdf.Matrix.scale(SCALE_FACTOR, SCALE_FACTOR),
        mupdf.ColorSpace.DeviceRGB,
        false, // no alpha/transparency
        true, // include annotations
      )

      const pngBuffer = pixmap.asPNG()
      const base64 = Buffer.from(pngBuffer).toString('base64')

      images.push({
        page: i + 1,
        base64,
        mimeType: 'image/png',
      })
    } catch {
      // Log warning but continue with other pages
      console.warn(`Failed to render page ${i + 1}, skipping`)
    } finally {
      pixmap?.destroy()
      page?.destroy()
    }
  }

  doc.destroy()
  return images
}
