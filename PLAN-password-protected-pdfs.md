# Implementation Plan: Password-Protected PDF Support

## Overview

Enable users to upload password-protected PDF bank statements by:
1. Detecting encrypted PDFs during processing
2. Pausing and requesting password via email
3. Retrying processing once password is provided
4. Handling wrong passwords gracefully with retry flow

---

## Phase 1: Dependencies & Environment

### 1.1 Install pdfjs-dist
```bash
pnpm add pdfjs-dist
```

### 1.2 Add encryption key to environment
```typescript
// src/env.ts - add new server variable
UPLOAD_PASSWORD_ENCRYPTION_KEY: z.string().min(32),
```

```bash
# .env.local - generate with: openssl rand -hex 32
UPLOAD_PASSWORD_ENCRYPTION_KEY=<64-char-hex-string>
```

---

## Phase 2: Schema Changes

### 2.1 Update upload status enum
**File:** `src/db/schema.ts`

```typescript
export const uploadStatusEnum = pgEnum('upload_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'waiting_for_password',  // NEW
])
```

### 2.2 Add password field to upload table
**File:** `src/db/schema.ts`

```typescript
export const upload = pgTable('upload', {
  // ... existing fields
  encryptedPassword: text('encrypted_password'),  // NEW - AES-256 encrypted
})
```

### 2.3 Generate and run migration
```bash
pnpm db:generate
pnpm db:migrate
```

---

## Phase 3: Encryption Utility

### 3.1 Create encryption helper
**File:** `src/lib/crypto.ts` (new file)

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '@/env'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(env.UPLOAD_PASSWORD_ENCRYPTION_KEY, 'hex')

export function encryptPassword(password: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv:authTag:encrypted (all base64)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptPassword(encryptedData: string): string {
  const [ivB64, authTagB64, encryptedB64] = encryptedData.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}
```

---

## Phase 4: PDF Utilities

### 4.1 Create PDF helper
**File:** `src/lib/pdf.ts` (new file)

```typescript
import * as pdfjsLib from 'pdfjs-dist'

// Configure worker (needed for pdfjs-dist)
pdfjsLib.GlobalWorkerOptions.workerSrc = false // Disable worker for Node.js

export type PdfStatus =
  | { encrypted: false }
  | { encrypted: true; needsPassword: true }
  | { encrypted: true; needsPassword: false; decryptedData: Uint8Array }

/**
 * Check if PDF is password-protected and optionally decrypt it
 */
export async function processPdf(
  data: ArrayBuffer,
  password?: string
): Promise<PdfStatus> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      password: password,
    })

    const pdf = await loadingTask.promise

    // If we got here with a password, it was correct - return decrypted
    if (password) {
      return {
        encrypted: true,
        needsPassword: false,
        decryptedData: new Uint8Array(data) // pdfjs decrypts in memory
      }
    }

    // No password needed
    await pdf.destroy()
    return { encrypted: false }

  } catch (error: any) {
    // Check for password-related errors
    if (error?.name === 'PasswordException') {
      if (error.code === pdfjsLib.PasswordResponses.NEED_PASSWORD) {
        return { encrypted: true, needsPassword: true }
      }
      if (error.code === pdfjsLib.PasswordResponses.INCORRECT_PASSWORD) {
        throw new PdfIncorrectPasswordError()
      }
    }
    throw error
  }
}

export class PdfIncorrectPasswordError extends Error {
  constructor() {
    super('Incorrect PDF password')
    this.name = 'PdfIncorrectPasswordError'
  }
}
```

---

## Phase 5: Email Templates

### 5.1 Password required email
**File:** `src/trigger/emails/send-password-required.tsx` (new file)

```typescript
import { task } from '@trigger.dev/sdk/v3'
import { sendEmail } from '@/lib/resend'
import { PasswordRequiredEmail } from '@/components/emails/templates/password-required'

type Payload = {
  to: string
  fileName: string
  uploadId: string
  uploadsLink: string
}

export const sendPasswordRequiredTask = task({
  id: 'send-password-required-email',
  run: async ({ to, fileName, uploadId, uploadsLink }: Payload) => {
    await sendEmail({
      to,
      subject: 'Password required for your bank statement',
      react: <PasswordRequiredEmail
        fileName={fileName}
        uploadId={uploadId}
        uploadsLink={uploadsLink}
      />,
    })
  },
})
```

**File:** `src/components/emails/templates/password-required.tsx` (new file)

Template content:
- Explain the PDF is password-protected
- Show file name
- CTA button linking to uploads page
- Instructions to enter password

### 5.2 Wrong password email
**File:** `src/trigger/emails/send-wrong-password.tsx` (new file)

```typescript
import { task } from '@trigger.dev/sdk/v3'
import { sendEmail } from '@/lib/resend'
import { WrongPasswordEmail } from '@/components/emails/templates/wrong-password'

type Payload = {
  to: string
  fileName: string
  uploadId: string
  uploadsLink: string
}

export const sendWrongPasswordTask = task({
  id: 'send-wrong-password-email',
  run: async ({ to, fileName, uploadId, uploadsLink }: Payload) => {
    await sendEmail({
      to,
      subject: 'Incorrect password for your bank statement',
      react: <WrongPasswordEmail
        fileName={fileName}
        uploadId={uploadId}
        uploadsLink={uploadsLink}
      />,
    })
  },
})
```

**File:** `src/components/emails/templates/wrong-password.tsx` (new file)

Template content:
- Explain the password was incorrect
- Show file name
- CTA button to try again
- Helpful tips (caps lock, copy-paste issues, etc.)

---

## Phase 6: Background Job Updates

### 6.1 Update upload breakdown task
**File:** `src/trigger/ai/upload-breakdown.ts`

Add password check early in the flow:

```typescript
import { processPdf, PdfIncorrectPasswordError } from '@/lib/pdf'
import { decryptPassword } from '@/lib/crypto'
import { sendPasswordRequiredTask } from '@/trigger/emails/send-password-required'
import { sendWrongPasswordTask } from '@/trigger/emails/send-wrong-password'

// Inside the task, after downloading the file:

// 1. Get upload record to check for stored password
const [uploadRecord] = await db
  .select()
  .from(upload)
  .where(eq(upload.id, uploadId))

// 2. Decrypt password if exists
const password = uploadRecord.encryptedPassword
  ? decryptPassword(uploadRecord.encryptedPassword)
  : undefined

// 3. Check PDF status
let pdfBuffer = fileBuffer
try {
  const pdfStatus = await processPdf(fileBuffer, password)

  if (pdfStatus.encrypted && pdfStatus.needsPassword) {
    // No password provided yet - request it
    await db
      .update(upload)
      .set({ status: 'waiting_for_password' })
      .where(eq(upload.id, uploadId))

    await sendPasswordRequiredTask.trigger({
      to: user.email,
      fileName: uploadRecord.fileName,
      uploadId,
      uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
    })

    return { status: 'waiting_for_password' }
  }

  // If decrypted, pdfjs handles it - we continue with original buffer
  // OpenAI can read the decrypted content from pdfjs

} catch (error) {
  if (error instanceof PdfIncorrectPasswordError) {
    // Wrong password - clear it and ask again
    await db
      .update(upload)
      .set({
        status: 'waiting_for_password',
        encryptedPassword: null
      })
      .where(eq(upload.id, uploadId))

    await sendWrongPasswordTask.trigger({
      to: user.email,
      fileName: uploadRecord.fileName,
      uploadId,
      uploadsLink: `${env.NEXT_PUBLIC_APP_URL}/uploads`,
    })

    return { status: 'waiting_for_password' }
  }
  throw error
}

// Continue with existing flow...
```

### 6.2 Handle decrypted PDF for OpenAI
**Challenge:** pdfjs-dist decrypts in memory but we need to pass to OpenAI.

**Solution:** Use `pdf-lib` alongside pdfjs for re-exporting decrypted PDF:

```bash
pnpm add pdf-lib
```

**File:** `src/lib/pdf.ts` (update)

```typescript
import { PDFDocument } from 'pdf-lib'

export async function decryptPdfToBuffer(
  data: ArrayBuffer,
  password: string
): Promise<Uint8Array> {
  // Load with pdfjs to decrypt
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(data),
    password,
  })
  const pdfDoc = await loadingTask.promise

  // Use pdf-lib to create unencrypted copy
  const newPdf = await PDFDocument.load(data, {
    password,
    ignoreEncryption: false
  })

  // Save without encryption
  const decryptedBytes = await newPdf.save()

  await pdfDoc.destroy()
  return decryptedBytes
}
```

---

## Phase 7: API Endpoints

### 7.1 Add setPassword procedure
**File:** `src/server/routers/uploads.ts`

```typescript
import { encryptPassword } from '@/lib/crypto'
import { uploadBreakdownTask } from '@/trigger/ai/upload-breakdown'

// Add to uploads router:
setPassword: protectedProcedure
  .input(z.object({
    uploadId: z.string().uuid(),
    password: z.string().min(1).max(1000),
  }))
  .mutation(async ({ ctx, input }) => {
    const { uploadId, password } = input

    // 1. Verify upload exists and belongs to user
    const [existingUpload] = await ctx.db
      .select()
      .from(upload)
      .where(
        and(
          eq(upload.id, uploadId),
          eq(upload.userId, ctx.user.id)
        )
      )

    if (!existingUpload) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Upload not found',
      })
    }

    // 2. Verify status is waiting_for_password
    if (existingUpload.status !== 'waiting_for_password') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Upload is not waiting for password',
      })
    }

    // 3. Encrypt and store password
    const encryptedPassword = encryptPassword(password)

    await ctx.db
      .update(upload)
      .set({
        encryptedPassword,
        status: 'queued'  // Reset to queued for reprocessing
      })
      .where(eq(upload.id, uploadId))

    // 4. Trigger reprocessing
    await uploadBreakdownTask.trigger({
      uploadId,
      userId: ctx.user.id,
    })

    return { success: true }
  }),
```

---

## Phase 8: Constants Update

### 8.1 Update cancellable statuses
**File:** `src/constants/uploads.ts`

```typescript
export const CANCELLABLE_STATUSES = [
  'queued',
  'processing',
  'waiting_for_password'  // NEW
] as const
```

---

## Phase 9: UI Updates

### 9.1 Upload status badge
**File:** `src/app/(app)/(logged-in)/uploads/` (relevant component)

Add handling for `waiting_for_password` status:
- Show amber/yellow badge with "Waiting for password"
- Display password input form inline or in modal
- Submit button calls `uploads.setPassword` mutation

### 9.2 Password input component
**File:** `src/components/upload-password-form.tsx` (new file)

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'

type Props = {
  uploadId: string
  onSuccess?: () => void
}

export function UploadPasswordForm({ uploadId, onSuccess }: Props) {
  const [password, setPassword] = useState('')

  const setPasswordMutation = trpc.uploads.setPassword.useMutation({
    onSuccess: () => {
      toast.success('Password submitted, processing will retry')
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      setPasswordMutation.mutate({ uploadId, password })
    }}>
      <Input
        type="password"
        placeholder="Enter PDF password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button
        type="submit"
        loading={setPasswordMutation.isPending}
      >
        Submit & Retry
      </Button>
    </form>
  )
}
```

---

## Phase 10: Testing

### 10.1 Unit tests
- `src/lib/crypto.test.ts` - Encryption/decryption roundtrip
- `src/lib/pdf.test.ts` - Password detection, decryption, error handling

### 10.2 Integration tests
- Upload password-protected PDF → status becomes `waiting_for_password`
- Submit correct password → processing completes
- Submit wrong password → email sent, status stays `waiting_for_password`

### 10.3 Manual testing
- Create test PDFs with passwords using online tools
- Test full flow end-to-end

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add `pdfjs-dist`, `pdf-lib` |
| `src/env.ts` | Modify | Add `UPLOAD_PASSWORD_ENCRYPTION_KEY` |
| `src/db/schema.ts` | Modify | Add status + password field |
| `drizzle/XXXX_migration.sql` | New | Schema migration |
| `src/lib/crypto.ts` | New | Password encryption utils |
| `src/lib/pdf.ts` | New | PDF password detection/decryption |
| `src/trigger/ai/upload-breakdown.ts` | Modify | Add password check flow |
| `src/trigger/emails/send-password-required.tsx` | New | Email task |
| `src/trigger/emails/send-wrong-password.tsx` | New | Email task |
| `src/components/emails/templates/password-required.tsx` | New | Email template |
| `src/components/emails/templates/wrong-password.tsx` | New | Email template |
| `src/server/routers/uploads.ts` | Modify | Add `setPassword` procedure |
| `src/constants/uploads.ts` | Modify | Update cancellable statuses |
| `src/components/upload-password-form.tsx` | New | Password input UI |
| `src/app/(app)/(logged-in)/uploads/` | Modify | Show password form for waiting uploads |

---

## Sequence Diagram

```
User                    App                     Trigger.dev              Email
 │                       │                          │                      │
 ├──Upload PDF──────────>│                          │                      │
 │                       ├──Store file──────────────>                      │
 │                       ├──Trigger task────────────>│                     │
 │                       │                          ├──Check password      │
 │                       │                          ├──Detect encrypted    │
 │                       │                          ├──Update status       │
 │                       │                          ├──Send email─────────>│
 │                       │                          │                      ├──Deliver
 │<─────────────────────────────────────────────────────────────Email──────┤
 │                       │                          │                      │
 ├──Enter password──────>│                          │                      │
 │                       ├──Encrypt & store         │                      │
 │                       ├──Trigger retry──────────>│                      │
 │                       │                          ├──Decrypt PDF         │
 │                       │                          ├──Process with OpenAI │
 │                       │                          ├──Complete            │
 │                       │                          ├──Send success email─>│
 │<─────────────────────────────────────────────────────────────Email──────┤
 │                       │                          │                      │
```

---

## Security Considerations

1. **Password encryption**: AES-256-GCM with unique IV per password
2. **Password lifecycle**: Cleared after successful processing or can be manually cleared
3. **Key rotation**: Plan for key rotation strategy (re-encrypt on rotation)
4. **Audit logging**: Consider logging password submission attempts (without the password)
5. **Rate limiting**: Apply existing rate limiting to `setPassword` endpoint

---

## Rollout Plan

1. Deploy schema migration (backwards compatible - new nullable field)
2. Deploy code changes
3. Add environment variable to all environments
4. Test with staging uploads
5. Monitor for issues
6. Consider feature flag if needed for gradual rollout
