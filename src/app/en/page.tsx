import HomePage, { getHomeMetadata } from '@/views/home'

export const metadata = getHomeMetadata('en')

export default function Page() {
  return <HomePage locale="en" />
}
