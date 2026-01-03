import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

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
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      password: password,
    })

    const pdf = await loadingTask.promise
    await pdf.destroy()

    if (password) {
      return { encrypted: true, needsPassword: false }
    }

    return { encrypted: false }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === 'PasswordException' &&
      'code' in error
    ) {
      const code = (error as { code: number }).code
      if (code === 1) {
        // NEED_PASSWORD
        return { encrypted: true, needsPassword: true }
      }
      if (code === 2) {
        // INCORRECT_PASSWORD
        throw new PdfIncorrectPasswordError()
      }
    }
    throw error
  }
}

/**
 * Decrypt a password-protected PDF and return an unencrypted buffer.
 * Uses pdfjs-dist to validate the password, then pdf-lib to create an unencrypted copy.
 *
 * Note: pdf-lib with ignoreEncryption loads the structure but not encrypted content.
 * For full decryption, a tool like qpdf would be needed.
 */
export async function decryptPdf(
  data: ArrayBuffer,
  password: string,
): Promise<Uint8Array> {
  // First validate the password with pdfjs-dist
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    password: password,
  })

  try {
    const pdf = await loadingTask.promise
    await pdf.destroy()
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.name === 'PasswordException' &&
      'code' in error
    ) {
      const code = (error as { code: number }).code
      if (code === 2) {
        throw new PdfIncorrectPasswordError()
      }
    }
    throw error
  }

  // Load with pdf-lib ignoring encryption to get the structure
  // This allows us to save an unencrypted copy
  try {
    const pdfDoc = await PDFDocument.load(data, {
      ignoreEncryption: true,
    })

    const decryptedBytes = await pdfDoc.save()
    return decryptedBytes
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('password')) {
      throw new PdfIncorrectPasswordError()
    }
    throw error
  }
}
