import { Button, Link, Section, Text } from '@react-email/components'
import { Layout } from '../components/layout'

interface PasswordRequiredEmailProps {
  fileName: string
  uploadsLink: string
}

export default function PasswordRequiredEmail({
  fileName = 'mybankstatement.pdf',
  uploadsLink = 'https://bugdet.co/uploads',
}: PasswordRequiredEmailProps) {
  return (
    <Layout preview="Password required for your bank statement">
      <Section className="px-[24px] py-[32px] bg-white">
        <Text className="text-[16px] text-gray-800 mb-[24px]">Hi,</Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          Your bank statement <strong>{fileName}</strong> is password-protected.
          To process it, we need the password you used to protect the file.
        </Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          Please enter the password for your file:
        </Text>

        <Button
          className="bg-[#999A5E] text-white font-bold py-[12px] px-[24px] rounded-[8px] text-[16px] no-underline text-center block box-border"
          href={uploadsLink}
          style={{
            borderTop: '1px solid #999A5E',
            borderLeft: '1px solid #999A5E',
            borderRight: '4px solid #76773C',
            borderBottom: '4px solid #76773C',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          Enter password
        </Button>

        <Text className="text-[14px] text-gray-600 text-left mt-[16px] mb-[24px]">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            href={uploadsLink}
            className="text-[#76773C] font-medium break-all"
          >
            {uploadsLink}
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
            Why do we need the password?
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            Your bank may have added password protection to keep your data
            secure. We need this password to read and process your statement.
          </Text>
          <Text className="text-[16px] text-gray-800 mt-[12px] mb-[0px] m-0">
            Your password is encrypted and only used to unlock this specific
            file. It will be deleted after processing.
          </Text>
        </Section>
      </Section>
    </Layout>
  )
}
