import { randomUUID } from 'node:crypto'
import { FROM_EMAIL_ADDRESS } from '@/constants/resend'
import { env } from '@/env'
import { Resend } from 'resend'
import { logger } from './logger'

const resendClient = new Resend(env.RESEND_API_KEY)

interface SendEmailProps {
  to: string
  subject: string
  react: React.ReactElement
}

async function sendEmail({ to, subject, react }: SendEmailProps) {
  const { data, error } = await resendClient.emails.send({
    from: FROM_EMAIL_ADDRESS,
    to,
    subject,
    react,
    headers: {
      'X-Entity-Ref-ID': randomUUID(),
    },
  })

  if (error) {
    logger.error('Error sending email', error)
    throw new Error(error.message)
  }

  return data
}

async function createContactWithSegment(email: string, segmentId: string) {
  const { data, error } = await resendClient.contacts.create({
    email,
    unsubscribed: false,
    audienceId: segmentId,
  })

  if (error) {
    logger.error('Error creating contact with segment', error)
    throw new Error(error.message)
  }

  return data
}

async function removeContactFromSegment(email: string, segmentId: string) {
  const { error } = await resendClient.contacts.segments.remove({
    email,
    segmentId,
  })

  if (error) {
    logger.error('Error removing contact from segment', error)
    throw new Error(error.message)
  }
}

export const resend = {
  sendEmail,
  createContactWithSegment,
  removeContactFromSegment,
}
