import { describe, expect, it } from 'vitest'
import { pctChange, toCsv } from './format'

describe('admin formatting', () => {
  it('computes period-over-period change', () => {
    expect(pctChange(120, 100)).toBe(20)
    expect(pctChange(80, 100)).toBe(-20)
    expect(pctChange(50, 0)).toBeNull()
  })

  it('escapes CSV and neutralises spreadsheet formulas', () => {
    const csv = toCsv(
      [{ a: 'plain', b: 'has, comma' }, { a: '=HYPERLINK("x")', b: 'line\nbreak' }],
      [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
    )
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('A,B')
    expect(lines[1]).toBe('plain,"has, comma"')
    expect(lines[2]).toBe(`"'=HYPERLINK(""x"")","line\nbreak"`)
  })
})
