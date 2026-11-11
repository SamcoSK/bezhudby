import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import DifficultySelector from '../src/components/DifficultySelector'
import FilterBar from '../src/components/FilterBar'
import type { Filters } from '../src/types'
import { ALL_GENRES } from '../src/types'

describe('DifficultySelector - behavior in Slovak mode', () => {
  it('locks to Easy and disables Medium and Hard in Slovak mode', () => {
    const html = renderToString(
      <DifficultySelector current="hard" onChange={vi.fn()} isSkMode={true} />
    )
    // All 3 difficulties are visible
    expect(html).toContain('Ľahká')
    expect(html).toContain('Stredná')
    expect(html).toContain('Ťažká')
    // Easy is active
    expect(html).toContain('bg-gradient-to-r')
    // Medium and Hard are disabled & greyed out
    expect(html).toContain('cursor-not-allowed')
    expect(html).toContain('Nedostupné pre SK')
  })

  it('renders all options interactive when isSkMode is false (English mode)', () => {
    const html = renderToString(
      <DifficultySelector current="medium" onChange={vi.fn()} isSkMode={false} />
    )
    expect(html).not.toContain('cursor-not-allowed')
    expect(html).not.toContain('Nedostupné pre SK')
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
    // In new UI, EN genre chips are hidden entirely in SK mode (not disabled)
    // The SK toggle button should be chip-active
    expect(html).toContain('chip-active')
    // No EN genre names should appear in SK mode
    expect(html).not.toContain('Hip-hop')
    expect(html).not.toContain('Elektronika')
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
    // SK type chips not shown in English mode
    expect(html).not.toContain('Typ slovenských skladieb')
    // EN genre chips should appear
    expect(html).toContain('Hip-hop')
    expect(html).toContain('Elektronika')
    // No chip-disabled in English mode
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
