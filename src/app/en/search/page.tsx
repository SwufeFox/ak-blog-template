import SearchPage, { getSearchMetadata } from '@/views/search'

export const metadata = getSearchMetadata('en')

export default function Page() {
  return <SearchPage locale="en" />
}
