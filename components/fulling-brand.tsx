import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

type FullingBrandProps = {
  className?: string
  href?: string
}

export function FullingBrand({ className, href = '/' }: FullingBrandProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex w-max items-center gap-2 text-xl font-semibold leading-none text-foreground',
        className,
      )}
      aria-label="Fulling home"
    >
      <span className="relative size-6 overflow-hidden" aria-hidden="true">
        <Image
          src="/icon-transparent.svg"
          alt=""
          width={40}
          height={40}
          className="absolute -left-2 -top-2 size-10 max-w-none brightness-0"
          priority
        />
      </span>
      <span>Fulling</span>
    </Link>
  )
}
