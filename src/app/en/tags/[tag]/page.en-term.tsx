import TermPage, { getTermMetadata, getTermParams } from '@/views/term'

export const dynamicParams = false

export function generateStaticParams() {
  return getTermParams('en')
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  return getTermMetadata('en', (await params).tag)
}

export default async function Page({ params }: { params: Promise<{ tag: string }> }) {
  return <TermPage locale="en" tag={(await params).tag} />
}
