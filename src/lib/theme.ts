export const Colors = {
  primary: '#0A1F44',
  primaryLight: '#122B5E',
  accent: '#F5B400',
  accentDark: '#D49E00',
  success: '#16C784',
  error: '#FF4D4F',
  white: '#FFFFFF',
  black: '#000000',
  background: '#060F22',
  surface: '#0D1B38',
  surfaceElevated: '#132244',
  border: '#1E3060',
  textPrimary: '#FFFFFF',
  textSecondary: '#8899BB',
  textMuted: '#4A6080',
  overlay: 'rgba(0,0,0,0.6)',
};

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  arabicRegular: 'Tajawal-Regular',
  arabicMedium: 'Tajawal-Medium',
  arabicBold: 'Tajawal-Bold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Convert micro-units to KWD display string (1 KWD = 1,000,000 micro)
export const formatKWD = (microUnits: number): string => {
  const kwd = microUnits / 1_000_000;
  return `${kwd.toFixed(3)} KWD`;
};
