import { getFeed } from '@/views/feed'

export const dynamic = 'force-static'

export function GET() {
  return getFeed('zh')
}
