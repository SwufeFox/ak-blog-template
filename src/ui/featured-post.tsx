import type { ReactNode } from 'react'

export interface FeaturedPostProps {
  href: string
  date: string
  dateLabel: string
  readTime: string
  actionLabel: string
  eyebrow: string
  title: ReactNode
  description: ReactNode
  category?: ReactNode
  className?: string
}

export function FeaturedPost({
  href,
  date,
  dateLabel,
  readTime,
  actionLabel,
  eyebrow,
  title,
  description,
  category,
  className,
}: FeaturedPostProps) {
  return (
    <article className={className ? `featured-post ${className}` : 'featured-post'}>
      <p className="featured-post__eyebrow">{eyebrow}</p>
      <div className="featured-post__meta">
        {category ? <span>{category}</span> : null}
        <time dateTime={date}>{dateLabel}</time>
        <span>{readTime}</span>
      </div>
      <a className="featured-post__link" href={href}>
        <h2 className="featured-post__title">{title}</h2>
        <p className="featured-post__description">{description}</p>
        <span className="featured-post__action">
          {actionLabel}
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24" fill="none">
            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </a>
    </article>
  )
}
