import SearchPage, { getSearchMetadata } from '@/views/search'

export const metadata = getSearchMetadata('zh')

export default function Page() {
  return <SearchPage locale="zh" />
}
