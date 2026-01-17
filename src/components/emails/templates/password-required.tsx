import { Button, Link, Section, Text } from "@react-email/components";
import { Layout } from "../components/layout";

interface PasswordRequiredEmailProps {
  fileName: string;
  uploadsLink: string;
}

export default function PasswordRequiredEmail({
  fileName = "mybankstatement.pdf",
  uploadsLink = "https://bugdet.co/uploads",
}: PasswordRequiredEmailProps) {
  return (
    <Layout preview="Password required for your bank statement">
      <Section className="bg-white px-[24px] py-[32px]">
        <Text className="mb-[24px] text-[16px] text-gray-800">Hi,</Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          Your bank statement <strong>{fileName}</strong> is password-protected.
          To process it, we need the password you used to protect the file.
        </Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          Please enter the password for your file:
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
          Enter password
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
            Why do we need the password?
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            Your bank may have added password protection to keep your data
            secure. We need this password to read and process your statement.
          </Text>
          <Text className="m-0 mt-[12px] mb-[0px] text-[16px] text-gray-800">
            Your password is encrypted and only used to unlock this specific
            file. It will be deleted after processing.
          </Text>
        </Section>
      </Section>
    </Layout>
  );
}
