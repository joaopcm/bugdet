import * as mupdf from 'mupdf'

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
 * Extract text content from all pages of a PDF.
 */
export async function extractTextFromPdf(
  data: ArrayBuffer,
  password?: string,
): Promise<string> {
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

  const pageCount = doc.countPages()
  const textParts: string[] = []

  for (let i = 0; i < pageCount; i++) {
    const page = doc.loadPage(i)
    const structuredText = page.toStructuredText()
    const pageText = structuredText.asText()
    if (pageText.trim()) {
      textParts.push(pageText)
    }
  }

  doc.destroy()
  return textParts.join('\n\n')
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
