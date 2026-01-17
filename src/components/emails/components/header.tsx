import { Heading, Section } from "@react-email/components";
import type { PropsWithChildren } from "react";

interface HeaderProps extends PropsWithChildren {
  title?: string;
}

export function Header({ title = "Budget" }: HeaderProps) {
  return (
    <Section className="bg-[#999A5E] px-[24px] py-[32px]">
      <Heading className="m-0 text-center font-bold text-[28px] text-white">
        {title}
      </Heading>
    </Section>
  );
}
