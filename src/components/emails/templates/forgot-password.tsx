import { Button, Link, Section, Text } from '@react-email/components'
import { Layout } from '../components/layout'

interface ForgotPasswordEmailProps {
  resetPasswordLink: string
}

export default function ForgotPasswordEmail({
  resetPasswordLink,
}: ForgotPasswordEmailProps) {
  return (
    <Layout preview="Reset your password">
      <Section className="px-[24px] py-[32px] bg-white">
        <Text className="text-[16px] text-gray-800 mb-[24px]">Hi,</Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          We received a request to reset your password for your Budget.co
          account. If you didn't make this request, you can safely ignore this
          email.
        </Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          To reset your password and regain access to your account, please click
          the button below:
        </Text>

        <Button
          className="bg-[#999A5E] text-white font-bold py-[12px] px-[24px] rounded-[8px] text-[16px] no-underline text-center block box-border"
          href={resetPasswordLink}
          style={{
            borderTop: '1px solid #999A5E',
            borderLeft: '1px solid #999A5E',
            borderRight: '4px solid #76773C',
            borderBottom: '4px solid #76773C',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          Reset my password
        </Button>

        <Text className="text-[14px] text-gray-600 text-left mt-[16px] mb-[24px]">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            href={resetPasswordLink}
            className="text-[#76773C] font-medium break-all"
          >
            {resetPasswordLink}
          </Link>
        </Text>

        <Section
          className="bg-[#F4F4F0] p-[24px] mb-[24px] rounded-[8px]"
          style={{
            borderTop: '1px solid #999A5E',
            borderLeft: '1px solid #999A5E',
            borderRight: '5px solid #76773C',
            borderBottom: '5px solid #76773C',
          }}
        >
          <Text className="text-[18px] font-bold text-[#76773C] mb-[16px]">
            Important security information
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            • This link will expire in 30 minutes
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            • Create a strong, unique password
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            • Never share your password with anyone
          </Text>
        </Section>
      </Section>
    </Layout>
  )
}
