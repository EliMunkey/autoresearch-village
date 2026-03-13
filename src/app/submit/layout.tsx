import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Submit a Project | AutoResearch Village' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
