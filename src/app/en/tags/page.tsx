import TagsPage, { getTagsMetadata } from '@/views/tags'

export const metadata = getTagsMetadata('en')

export default function Page() {
  return <TagsPage locale="en" />
}
