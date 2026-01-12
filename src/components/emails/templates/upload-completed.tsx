import { pluralize } from '@/lib/utils'
import { Button, Link, Section, Text } from '@react-email/components'
import { Layout } from '../components/layout'

interface UploadCompletedEmailProps {
  fileName: string
  transactionCount: number
  categoriesCreated: number
  rulesApplied: number
  lowConfidenceCount: number
  uploadsLink: string
}

export default function UploadCompletedEmail({
  fileName = 'mybankstatement.pdf',
  transactionCount = 100,
  categoriesCreated = 10,
  rulesApplied = 0,
  lowConfidenceCount = 0,
  uploadsLink = 'https://bugdet.co/uploads',
}: UploadCompletedEmailProps) {
  return (
    <Layout
      preview={`Your bank statement ${fileName} has been processed successfully. Here's a summary of the results.`}
    >
      <Section className="px-[24px] py-[32px] bg-white">
        <Text className="text-[16px] text-gray-800 mb-[24px]">Hi,</Text>

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          Great news! Your bank statement <strong>{fileName}</strong> has been
          successfully processed.
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
            Summary
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            • <strong>{transactionCount}</strong>{' '}
            {pluralize(transactionCount, 'transaction')} imported
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[8px] m-0">
            • <strong>{categoriesCreated}</strong> new{' '}
            {pluralize(categoriesCreated, 'category', 'categories')} created
          </Text>
          <Text className="text-[16px] text-gray-800 mb-[0px] m-0">
            • <strong>{rulesApplied}</strong>{' '}
            {pluralize(rulesApplied, 'rule match', 'rule matches')}
          </Text>
        </Section>

        {lowConfidenceCount > 0 && (
          <Section className="mb-[24px]">
            <Text className="text-[16px] text-gray-800 m-0">
              We noticed that{' '}
              <strong>
                {lowConfidenceCount}{' '}
                {pluralize(lowConfidenceCount, 'transaction')}
              </strong>{' '}
              {pluralize(lowConfidenceCount, "wasn't", "weren't")} easy to
              categorize automatically. Don't worry — our financial copilot is
              taking a closer look in the background to improve the
              categorization. You'll see the updated results shortly.
            </Text>
          </Section>
        )}

        <Text className="text-[16px] text-gray-800 mb-[24px]">
          View your transactions and make any adjustments to categories as
          needed:
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
          View my uploads
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
      </Section>
    </Layout>
  )
}
