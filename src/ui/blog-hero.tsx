import { AkHero } from '@swufefox/ak-ui-react'
import type { ReactNode } from 'react'

export interface BlogHeroProps {
  title: ReactNode
  description: ReactNode
  eyebrow?: ReactNode
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  className?: string
}

export function BlogHero({
  title,
  description,
  eyebrow,
  titleAs = 'h1',
  className,
}: BlogHeroProps) {
  return (
    <AkHero
      className={className ? `blog-hero ${className}` : 'blog-hero'}
      eyebrow={eyebrow}
      title={title}
      titleAs={titleAs}
      description={description}
      side={false}
      bar={false}
    />
  )
}
