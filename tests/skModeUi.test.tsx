import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import DifficultySelector from '../src/components/DifficultySelector'
import FilterBar from '../src/components/FilterBar'
import type { Filters } from '../src/types'
import { ALL_GENRES } from '../src/types'

describe('DifficultySelector - visibility in Slovak mode', () => {
  it('reserves space and sets visibility: hidden when hidden=true (Slovak mode)', () => {
    const html = renderToString(
      <DifficultySelector current="easy" onChange={vi.fn()} hidden={true} />
    )
    expect(html).toContain('visibility:hidden')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('disabled=""')
  })

  it('renders visible and interactive when hidden=false (English mode)', () => {
    const html = renderToString(
      <DifficultySelector current="easy" onChange={vi.fn()} hidden={false} />
    )
    expect(html).toContain('visibility:visible')
    expect(html).toContain('aria-hidden="false"')
    expect(html).not.toContain('disabled=""')
    expect(html).toContain('Ľahká')
    expect(html).toContain('Stredná')
    expect(html).toContain('Ťažká')
  })
})

describe('FilterBar - SK mode and skType chips', () => {
  const baseFilters: Filters = {
    skMode: true,
    skTypes: ['modern', 'og', 'folk'],
    genres: [...ALL_GENRES],
    difficulty: 'easy',
  }

  it('shows SK type chips (Moderné, OG, Ľudovky) when skMode is true', () => {
    const html = renderToString(
      <FilterBar
        filters={baseFilters}
        onSkModeChange={vi.fn()}
        onSkTypeToggle={vi.fn()}
        onGenreToggle={vi.fn()}
        onGenreSelectAll={vi.fn()}
      />
    )
    expect(html).toContain('Moderné')
    expect(html).toContain('OG')
    expect(html).toContain('Ľudovky')
    // Genre chips should be disabled when skMode is true
    expect(html).toContain('chip-disabled')
  })

  it('hides SK type chips when skMode is false', () => {
    const html = renderToString(
      <FilterBar
        filters={{ ...baseFilters, skMode: false }}
        onSkModeChange={vi.fn()}
        onSkTypeToggle={vi.fn()}
        onGenreToggle={vi.fn()}
        onGenreSelectAll={vi.fn()}
      />
    )
    expect(html).not.toContain('Typ slovenských skladieb')
    expect(html).not.toContain('chip-disabled')
  })

  it('disables the last active skType chip so it cannot be toggled off', () => {
    const singleTypeFilters: Filters = {
      ...baseFilters,
      skTypes: ['modern'], // only one left
    }
    const html = renderToString(
      <FilterBar
        filters={singleTypeFilters}
        onSkModeChange={vi.fn()}
        onSkTypeToggle={vi.fn()}
        onGenreToggle={vi.fn()}
        onGenreSelectAll={vi.fn()}
      />
    )
    // The 'modern' button should be disabled because it's the last active one
    expect(html).toContain('posledný aktívny, nedá sa vypnúť')
    expect(html).toContain('Aspoň jeden typ musí ostať aktívny')
  })
})
