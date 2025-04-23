import { Section, Text } from '@react-email/components'

export function Footer() {
  return (
    <Section className="bg-[#999A5E] px-[24px] py-[24px]">
      <Text className="text-[14px] text-white text-center m-0">
        © {new Date().getFullYear()} Budget.co - Smart Financial Management
      </Text>
      <Text className="text-[14px] text-white text-center m-0">
        São Paulo, SP, Brazil
      </Text>
    </Section>
  )
}
