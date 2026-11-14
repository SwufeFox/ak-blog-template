import Link from 'next/link'
import { AkCodeId, AkHeading, AkStripes, AkWatermark } from '@swufefox/ak-ui-react'

import { ui } from '@/lib/i18n'
import { homePath } from '@/lib/urls'
import type { Locale } from '@/site.config'

export default function NotFound({ locale }: { locale: Locale }) {
  const copy = ui(locale)

  return (
    <section className="route-page error-page">
      <AkStripes className="error-page__stripes" variant="hazard" bar aria-hidden="true" />
      <p className="error-page__eyebrow">
        <AkCodeId>ERR / 404</AkCodeId>
      </p>
      <AkHeading className="error-page__heading" title={copy.notFoundTitle} level={1} size="lg" />
      <p className="route-head__summary">{copy.notFoundText}</p>
      <p className="error-page__action">
        <Link className="cta" href={homePath(locale)}>
          {copy.notFoundAction}
        </Link>
      </p>
      <AkWatermark className="error-page__watermark">404</AkWatermark>
    </section>
  )
}