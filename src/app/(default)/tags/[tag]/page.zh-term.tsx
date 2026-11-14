import TermPage, { getTermMetadata, getTermParams } from '@/views/term'

export const dynamicParams = false

export function generateStaticParams() {
  return getTermParams('zh')
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  return getTermMetadata('zh', (await params).tag)
}

export default async function Page({ params }: { params: Promise<{ tag: string }> }) {
  return <TermPage locale="zh" tag={(await params).tag} />
}
