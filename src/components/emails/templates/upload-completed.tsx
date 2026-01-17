import { Button, Link, Section, Text } from "@react-email/components";
import { pluralize } from "@/lib/utils";
import { Layout } from "../components/layout";

interface UploadCompletedEmailProps {
  fileName: string;
  transactionCount: number;
  categoriesCreated: number;
  rulesApplied: number;
  lowConfidenceCount: number;
  uploadsLink: string;
}

export default function UploadCompletedEmail({
  fileName = "mybankstatement.pdf",
  transactionCount = 100,
  categoriesCreated = 10,
  rulesApplied = 0,
  lowConfidenceCount = 0,
  uploadsLink = "https://bugdet.co/uploads",
}: UploadCompletedEmailProps) {
  return (
    <Layout
      preview={`Your bank statement ${fileName} has been processed successfully. Here's a summary of the results.`}
    >
      <Section className="bg-white px-[24px] py-[32px]">
        <Text className="mb-[24px] text-[16px] text-gray-800">Hi,</Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          Great news! Your bank statement <strong>{fileName}</strong> has been
          successfully processed.
        </Text>

        <Section
          className="mb-[24px] rounded-[8px] bg-[#F4F4F0] p-[24px] pt-0"
          style={{
            borderTop: "1px solid #999A5E",
            borderLeft: "1px solid #999A5E",
            borderRight: "5px solid #76773C",
            borderBottom: "5px solid #76773C",
          }}
        >
          <Text className="mb-[16px] font-bold text-[#76773C] text-[18px]">
            Summary
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            • <strong>{transactionCount}</strong>{" "}
            {pluralize(transactionCount, "transaction")} imported
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            • <strong>{categoriesCreated}</strong> new{" "}
            {pluralize(categoriesCreated, "category", "categories")} created
          </Text>
          <Text className="m-0 mb-[0px] text-[16px] text-gray-800">
            • <strong>{rulesApplied}</strong>{" "}
            {pluralize(rulesApplied, "rule match", "rule matches")}
          </Text>
        </Section>

        {lowConfidenceCount > 0 && (
          <Section className="mb-[24px]">
            <Text className="m-0 text-[16px] text-gray-800">
              We noticed that{" "}
              <strong>
                {lowConfidenceCount}{" "}
                {pluralize(lowConfidenceCount, "transaction")}
              </strong>{" "}
              {pluralize(lowConfidenceCount, "wasn't", "weren't")} easy to
              categorize automatically. Don't worry — our financial copilot is
              taking a closer look in the background to improve the
              categorization. You'll see the updated results shortly.
            </Text>
          </Section>
        )}

        <Text className="mb-[24px] text-[16px] text-gray-800">
          View your transactions and make any adjustments to categories as
          needed:
        </Text>

        <Button
          className="box-border block rounded-[8px] bg-[#999A5E] px-[24px] py-[12px] text-center font-bold text-[16px] text-white no-underline"
          href={uploadsLink}
          style={{
            borderTop: "1px solid #999A5E",
            borderLeft: "1px solid #999A5E",
            borderRight: "4px solid #76773C",
            borderBottom: "4px solid #76773C",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          View my uploads
        </Button>

        <Text className="mt-[16px] mb-[24px] text-left text-[14px] text-gray-600">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            className="break-all font-medium text-[#76773C]"
            href={uploadsLink}
          >
            {uploadsLink}
          </Link>
        </Text>
      </Section>
    </Layout>
  );
}
