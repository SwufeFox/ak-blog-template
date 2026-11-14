import PostPage, { getPostMetadata, getPostParams } from '@/views/post'

export const dynamicParams = false

export function generateStaticParams() {
  return getPostParams('zh')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return getPostMetadata('zh', (await params).slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <PostPage locale="zh" slug={(await params).slug} />
}
