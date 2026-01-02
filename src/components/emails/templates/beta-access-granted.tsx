import { Button, Hr, Link, Section, Text } from '@react-email/components'
import { Layout } from '../components/layout'

interface BetaAccessGrantedEmailProps {
  signUpLink: string
}

export default function BetaAccessGrantedEmail({
  signUpLink = 'http://localhost:3000/sign-up',
}: BetaAccessGrantedEmailProps) {
  return (
    <Layout preview="You're in! Beta access granted">
      <Section className="px-[24px] py-[32px] bg-white">
        <Text className="text-[16px] text-gray-800 mb-[24px]">Hi,</Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          Great news! You've been granted access to the Bugdet.co beta. We're
          excited to have you join us as one of our early users.
        </Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          You can now create your account and start using Bugdet.co:
        </Text>

        <Button
          className="bg-[#999A5E] text-white font-bold py-[12px] px-[24px] rounded-[8px] text-[16px] no-underline text-center block box-border"
          href={signUpLink}
          style={{
            borderTop: '1px solid #999A5E',
            borderLeft: '1px solid #999A5E',
            borderRight: '4px solid #76773C',
            borderBottom: '4px solid #76773C',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          Create my account
        </Button>

        <Text className="text-[14px] text-gray-600 text-left mt-[16px] mb-[24px]">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            href={signUpLink}
            className="text-[#76773C] font-medium break-all"
          >
            {signUpLink}
          </Link>
        </Text>

        <Section
          className="bg-[#F4F4F0] p-[24px] pt-0 mb-[24px] rounded-[8px]"
          style={{
            borderTop: '1px solid #999A5E',
            borderLeft: '1px solid #999A5E',
            borderRight: '5px solid #76773C',
            borderBottom: '5px solid #76773C',
          }}
        >
          <Text className="text-[18px] font-bold text-[#76773C] mb-[16px]">
            What you'll get with Bugdet.co
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            - AI-powered transaction categorization
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            - Automated expense reports and insights
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            - Easy bank statement uploads
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[0px] m-0">
            - Personalized financial recommendations
          </Text>
        </Section>
      </Section>

      <Hr className="border-[#999A5E] border-dashed my-[0px]" />

      <Section className="px-[24px] py-[32px] bg-[#F9F9F5]">
        <Text className="text-[18px] font-bold text-[#76773C] mb-[16px]">
          Getting started is easy
        </Text>

        <Section className="pl-[16px] mb-[0px]">
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            1. Create your account using the button above
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            2. Upload your bank statements
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[0px] m-0">
            3. Let our AI organize your finances
          </Text>
        </Section>
      </Section>
    </Layout>
  )
}
