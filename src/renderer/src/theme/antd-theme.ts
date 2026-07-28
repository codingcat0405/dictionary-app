import type { ThemeConfig } from 'antd'

/**
 * Single source of truth for antd's runtime theme tokens.
 * Mirrors the oklch primitives in `main.css` (§1 of the design system brief) so antd
 * components render the exact same blue/radius as Tailwind-styled and shadcn elements.
 */
const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#3B6BEF',
    colorSuccess: '#16A34A',
    colorWarning: '#D97706',
    colorError: '#DC2626',
    colorInfo: '#3B6BEF',
    colorTextBase: '#0F172A', // neutral-900
    colorBgBase: '#FFFFFF',
    colorBorder: '#E2E8F0', // neutral-200
    borderRadius: 8,
    fontFamily: '"Be Vietnam Pro", -apple-system, sans-serif',
    controlHeight: 36
  },
  components: {
    Button: { borderRadius: 8, controlHeight: 36 },
    Input: { borderRadius: 8, controlHeight: 36 },
    Table: { borderRadius: 8, headerBg: '#F8FAFC' },
    Modal: { borderRadiusLG: 12 },
    Card: { borderRadiusLG: 12 }
  }
}

export default antdTheme
