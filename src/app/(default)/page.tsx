import HomePage, { getHomeMetadata } from '@/views/home'

export const metadata = getHomeMetadata('zh')

export default function Page() {
  return <HomePage locale="zh" />
}
