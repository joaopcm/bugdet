import { Section, Text } from "@react-email/components";

export function Footer() {
  return (
    <Section className="bg-[#999A5E] px-[24px] py-[24px]">
      <Text className="m-0 text-center text-[14px] text-white">
        © {new Date().getFullYear()} Budget
      </Text>
      <Text className="m-0 text-center text-[14px] text-white">
        São Paulo, SP, Brazil
      </Text>
    </Section>
  );
}
