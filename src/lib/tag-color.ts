/**
 * Deterministic color for a tag string.
 *
 * Returns a tinted background + matching foreground that work in light mode.
 * Same tag always maps to the same hue. Designed to harmonise with --nd-* tokens
 * (subtle, paper-like tints — not vivid).
 */

interface TagPalette {
  bg: string
  fg: string
  border: string
}

const PALETTE: TagPalette[] = [
  { bg: 'rgba(215, 25, 33, 0.08)',  fg: '#A8141B', border: 'rgba(215, 25, 33, 0.20)'  }, // accent red
  { bg: 'rgba(74, 158, 92, 0.10)',  fg: '#357044', border: 'rgba(74, 158, 92, 0.24)'  }, // success green
  { bg: 'rgba(212, 168, 67, 0.14)', fg: '#8C6A1F', border: 'rgba(212, 168, 67, 0.28)' }, // warning amber
  { bg: 'rgba(0, 122, 255, 0.10)',  fg: '#0058B8', border: 'rgba(0, 122, 255, 0.22)'  }, // interactive blue
  { bg: 'rgba(124, 58, 237, 0.10)', fg: '#5B26B8', border: 'rgba(124, 58, 237, 0.22)' }, // purple
  { bg: 'rgba(236, 72, 153, 0.10)', fg: '#B72572', border: 'rgba(236, 72, 153, 0.22)' }, // pink
  { bg: 'rgba(20, 184, 166, 0.10)', fg: '#0F7A6F', border: 'rgba(20, 184, 166, 0.22)' }, // teal
  { bg: 'rgba(102, 102, 102, 0.10)',fg: '#444444', border: 'rgba(102, 102, 102, 0.22)' },// neutral
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

export function tagColor(tag: string): TagPalette {
  return PALETTE[hash(tag.toLowerCase()) % PALETTE.length]
}
