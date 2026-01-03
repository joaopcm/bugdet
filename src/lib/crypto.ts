import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '@/env'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  return Buffer.from(env.UPLOAD_PASSWORD_ENCRYPTION_KEY, 'hex')
}

export function encryptPassword(password: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(password, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptPassword(encryptedData: string): string {
  const key = getEncryptionKey()
  const [ivB64, authTagB64, encryptedB64] = encryptedData.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}
