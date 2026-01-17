import { Button, Link, Section, Text } from "@react-email/components";
import { Layout } from "../components/layout";

interface UploadFailedEmailProps {
  fileName: string;
  uploadsLink: string;
}

export default function UploadFailedEmail({
  fileName = "mybankstatement.pdf",
  uploadsLink = "https://bugdet.co/uploads",
}: UploadFailedEmailProps) {
  return (
    <Layout preview="Your bank statement couldn't be processed">
      <Section className="bg-white px-[24px] py-[32px]">
        <Text className="mb-[24px] text-[16px] text-gray-800">Hi,</Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          We weren't able to process your bank statement{" "}
          <strong>{fileName}</strong>. This can happen if the file is corrupted,
          not a valid bank statement, or in an unsupported format.
        </Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          You can retry processing by clicking the "Retry" button on your
          uploads page, or delete the file if you no longer need it:
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
            Tips for successful uploads
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            • Use PDF files exported directly from your bank
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            • Avoid screenshots or scanned documents
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            • Ensure the file is not password-protected
          </Text>
          <Text className="m-0 mb-[0px] text-[16px] text-gray-800">
            • Check that the file is not corrupted
          </Text>
        </Section>
      </Section>
    </Layout>
  );
}
