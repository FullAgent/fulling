import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FullingBrand } from './fulling-brand'

describe('FullingBrand', () => {
  it('renders the canonical brand lockup and accessible home link', () => {
    const markup = renderToStaticMarkup(<FullingBrand />)

    expect(markup).toContain('href="/"')
    expect(markup).toContain('aria-label="Fulling home"')
    expect(markup).toContain('text-[22px]')
    expect(markup).toContain('leading-6')
    expect(markup).toContain('tracking-[-0.5px]')
    expect(markup).toContain('size-6')
    expect(markup).toContain('>Fulling</span>')
  })

  it('supports a surface-specific destination and layout class', () => {
    const markup = renderToStaticMarkup(
      <FullingBrand href="/workspace" className="shrink-0" />,
    )

    expect(markup).toContain('href="/workspace"')
    expect(markup).toContain('shrink-0')
  })
})
