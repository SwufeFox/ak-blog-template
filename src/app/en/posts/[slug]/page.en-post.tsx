import PostPage, { getPostMetadata, getPostParams } from '@/views/post'

export const dynamicParams = false

export function generateStaticParams() {
  return getPostParams('en')
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return getPostMetadata('en', (await params).slug)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  return <PostPage locale="en" slug={(await params).slug} />
}
