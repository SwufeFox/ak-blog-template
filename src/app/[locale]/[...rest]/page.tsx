import { notFound } from 'next/navigation'

/** Every path that is not a page of the site lands here. */
export default function CatchAll() {
  notFound()
}
