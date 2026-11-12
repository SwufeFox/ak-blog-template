export const THEME_STORAGE_KEY = 'ak-theme'

/** Keep in sync with `--ak-surface-canvas` for both ak-ui themes. */
export const THEME_COLORS = {
  archive: '#eef0f1',
  terminal: '#111315',
} as const

export type Theme = keyof typeof THEME_COLORS
