import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

const Email = () => {
  const confirmationLink = 'https://budget.co/confirm-account?token=abc123'

  return (
    <Html>
      <Head />
      <Preview>
        Confirm your Budget.co account and start tracking your finances
      </Preview>
      <Tailwind>
        <Body className="bg-[#F4F4F0] font-sans py-[40px]">
          <Container
            className="mx-auto bg-white rounded-[12px] overflow-hidden"
            style={{
              maxWidth: '600px',
              borderTop: '1px solid #999A5E',
              borderLeft: '1px solid #999A5E',
              borderRight: '6px solid #76773C',
              borderBottom: '6px solid #76773C',
              boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header */}
            <Section className="bg-[#999A5E] px-[24px] py-[32px]">
              <Heading className="text-[28px] text-white font-bold text-center m-0">
                Welcome to Budget.co
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="px-[24px] py-[32px] bg-white">
              <Text className="text-[16px] text-gray-800 mb-[24px]">
                Dear Budget Planner,
              </Text>

              <Text className="text-[16px] text-gray-800 mb-[24px]">
                Thank you for signing up with Budget.co! We're excited to help
                you take control of your finances with our AI-powered expense
                tracking and categorization.
              </Text>

              <Text className="text-[16px] text-gray-800 mb-[24px]">
                To get started, please confirm your account by clicking the
                button below:
              </Text>

              {/* Button with 3D border */}
              <Button
                className="bg-[#999A5E] text-white font-bold py-[12px] px-[24px] rounded-[8px] text-[16px] no-underline text-center block box-border"
                href={confirmationLink}
                style={{
                  borderTop: '1px solid #999A5E',
                  borderLeft: '1px solid #999A5E',
                  borderRight: '4px solid #76773C',
                  borderBottom: '4px solid #76773C',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                Confirm My Account
              </Button>

              {/* Text link alternative - updated to be left-aligned */}
              <Text className="text-[14px] text-gray-600 text-left mt-[16px] mb-[24px]">
                If the button doesn't work, copy and paste this link into your
                browser:
                <br />
                <Link
                  href={confirmationLink}
                  className="text-[#76773C] font-medium break-all"
                >
                  {confirmationLink}
                </Link>
              </Text>

              {/* Confirmation Box with 3D border */}
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
                  What You'll Get with Budget.co
                </Text>
                <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
                  • AI-powered transaction categorization
                </Text>
                <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
                  • Automated expense reports and insights
                </Text>
                <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
                  • Easy bank statement uploads
                </Text>
                <Text className="text-[16px] text-gray-800 mb-[0px] m-0">
                  • Personalized financial recommendations
                </Text>
              </Section>
            </Section>

            {/* Divider with Ghibli-style */}
            <Hr className="border-[#999A5E] border-dashed my-[0px]" />

            {/* Additional Information */}
            <Section className="px-[24px] py-[32px] bg-[#F9F9F5]">
              <Text className="text-[18px] font-bold text-[#76773C] mb-[16px]">
                Getting Started Is Easy
              </Text>

              <Section className="pl-[16px] mb-[24px]">
                <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
                  1. Confirm your account
                </Text>
                <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
                  2. Upload your bank statements
                </Text>
                <Text className="text-[16px] text-gray-800 mb-[0px] m-0">
                  3. Let our AI organize your finances
                </Text>
              </Section>

              <Text className="text-[16px] text-gray-800 mb-[0px]">
                After confirming your account, you'll be guided through a simple
                setup process to connect your financial data and start seeing
                insights right away.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="bg-[#999A5E] px-[24px] py-[24px]">
              <Text className="text-[14px] text-white text-center m-0">
                © 2025 Budget.co - Smart Financial Management
              </Text>
              <Text className="text-[14px] text-white text-center m-0">
                123 Finance Street, San Francisco, CA 94103
              </Text>
              <Text className="text-[14px] text-white text-center mt-[16px] m-0">
                <Link
                  href="https://budget.co/unsubscribe"
                  className="text-white underline"
                >
                  Unsubscribe
                </Link>{' '}
                •{' '}
                <Link
                  href="https://budget.co/preferences"
                  className="text-white underline"
                >
                  Preferences
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default Email
