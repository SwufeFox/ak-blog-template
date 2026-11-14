import TagsPage, { getTagsMetadata } from '@/views/tags'

export const metadata = getTagsMetadata('zh')

export default function Page() {
  return <TagsPage locale="zh" />
}
