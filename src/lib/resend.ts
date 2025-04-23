import { randomUUID } from 'node:crypto'
import { env } from '@/env'
import { render } from '@react-email/render'
import { Resend } from 'resend'

const resendClient = new Resend(env.RESEND_API_KEY)

const from =
  env.NODE_ENV === 'production'
    ? 'Bugdet <hi@bugdet.co>'
    : 'Bugdet - Development <bugdet@resend.dev>'

interface SendEmailProps {
  to: string
  subject: string
  react: React.ReactElement
}

async function sendEmail({ to, subject, react }: SendEmailProps) {
  const text = await render(react, {
    plainText: true,
  })

  const { data, error } = await resendClient.emails.send({
    from,
    to,
    subject,
    react,
    text,
    headers: {
      'X-Entity-Ref-ID': randomUUID(),
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const resend = {
  sendEmail,
}
