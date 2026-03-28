/**
 * App Theme - Color Palette
 * Black + Orange/Green color scheme
 */

export const COLORS = {
  // Primary Colors
  background: '#000000',
  backgroundSecondary: '#0A0A0A',
  backgroundTertiary: '#121212',

  // Accent Colors - Orange/Green
  primary: '#FF8C42', // Vibrant orange
  primaryLight: '#FFA366',
  primaryDark: '#E67A35',

  secondary: '#00D9A3', // Bright green
  secondaryLight: '#33E3B8',
  secondaryDark: '#00BF8F',

  // Gradient combinations
  gradientOrange: ['#FF8C42', '#FFB366'],
  gradientGreen: ['#00D9A3', '#33E3B8'],
  gradientMixed: ['#FF8C42', '#00D9A3'],

  // UI Colors
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  textTertiary: '#666666',

  border: '#1A1A1A',
  borderLight: 'rgba(255, 140, 66, 0.2)',

  // Status Colors
  success: '#00D9A3',
  warning: '#FF8C42',
  error: '#FF5252',
  info: '#42A5FF',

  // Task Category Colors (Orange/Green variations)
  meeting: '#FF8C42',
  working: '#FFB366',
  creative: '#00D9A3',
  building: '#33E3B8',
  focus: '#FFA366',
  personal: '#00BF8F',

  // Opacity variants
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  primaryOpacity: (opacity: number) => `rgba(255, 140, 66, ${opacity})`,
  secondaryOpacity: (opacity: number) => `rgba(0, 217, 163, ${opacity})`,
};

export const GRADIENTS = {
  primary: ['#FF8C42', '#FFB366'],
  secondary: ['#00D9A3', '#33E3B8'],
  mixed: ['#FF8C42', '#00D9A3'],
  dark: ['#0A0A0A', '#121212'],
};

export const SHADOWS = {
  small: {
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#FF8C42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#00D9A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
