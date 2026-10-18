// Web rem steps at a 16 px root, measured on mirlo.space at 390 px
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// --mi-side-paddings-xsmall, the page gutter at phone width
export const gutter = spacing.sm;

// --mi-border-radius, --mi-border-radius-focus, --mi-border-radius-x
export const radius = {
  sm: 3,
  md: 8,
  lg: 15,
  pill: 9999,
} as const;

// Platform minimum, the web uses 30 px (--mi-touch-target-min)
export const touchTarget = 44;
