import { Button, Hr, Link, Section, Text } from "@react-email/components";
import { Layout } from "../components/layout";

interface BetaAccessGrantedEmailProps {
  signUpLink: string;
}

export default function BetaAccessGrantedEmail({
  signUpLink = "http://localhost:3000/sign-up",
}: BetaAccessGrantedEmailProps) {
  return (
    <Layout preview="You're in! Beta access granted">
      <Section className="bg-white px-[24px] py-[32px]">
        <Text className="mb-[24px] text-[16px] text-gray-800">Hi,</Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          Great news! You've been granted access to the Bugdet.co beta. We're
          excited to have you join us as one of our early users.
        </Text>

        <Text className="mb-[24px] text-[16px] text-gray-800">
          You can now create your account and start using Bugdet.co:
        </Text>

        <Button
          className="box-border block rounded-[8px] bg-[#999A5E] px-[24px] py-[12px] text-center font-bold text-[16px] text-white no-underline"
          href={signUpLink}
          style={{
            borderTop: "1px solid #999A5E",
            borderLeft: "1px solid #999A5E",
            borderRight: "4px solid #76773C",
            borderBottom: "4px solid #76773C",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          Create my account
        </Button>

        <Text className="mt-[16px] mb-[24px] text-left text-[14px] text-gray-600">
          If the button doesn't work, copy and paste this link into your
          browser:
          <br />
          <Link
            className="break-all font-medium text-[#76773C]"
            href={signUpLink}
          >
            {signUpLink}
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
            What you'll get with Bugdet.co
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            - AI-powered transaction categorization
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            - Automated expense reports and insights
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            - Easy bank statement uploads
          </Text>
          <Text className="m-0 mb-[0px] text-[16px] text-gray-800">
            - Personalized financial recommendations
          </Text>
        </Section>
      </Section>

      <Hr className="my-[0px] border-[#999A5E] border-dashed" />

      <Section className="bg-[#F9F9F5] px-[24px] py-[32px]">
        <Text className="mb-[16px] font-bold text-[#76773C] text-[18px]">
          Getting started is easy
        </Text>

        <Section className="mb-[0px] pl-[16px]">
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            1. Create your account using the button above
          </Text>
          <Text className="m-0 mb-[8px] text-[16px] text-gray-800">
            2. Upload your bank statements
          </Text>
          <Text className="m-0 mb-[0px] text-[16px] text-gray-800">
            3. Let our AI organize your finances
          </Text>
        </Section>
      </Section>
    </Layout>
  );
}
