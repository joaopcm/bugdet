import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components'
import type { PropsWithChildren } from 'react'
import { Footer } from './footer'
import { Header } from './header'

interface LayoutProps extends PropsWithChildren {
  preview: string
  title?: string
}

export function Layout({ children, preview, title }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
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
            <Header title={title} />
            {children}
            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
