export const Colors = {
  background: '#0F1117',
  card: '#1A1D27',
  border: '#2A2D3A',
  accent: '#4F46E5',
  accentLight: '#6366F1',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  danger: '#EF4444',
  success: '#22C55E',
} as const;

export type ColorKey = keyof typeof Colors;
