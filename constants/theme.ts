/**
 * Design System SaúdeJá — baseado nos mockups Stitch
 * Material Design 3 + Public Sans
 *
 * Tokens extraídos dos HTMLs gerados pelo Stitch Designer
 */

// ─── PALETA MATERIAL 3 ──────────────────────────────────────────────────────
export const colors = {
  // Primary (verde escuro SUS)
  primary: '#00502c',
  primaryContainer: '#006b3c',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#90e9ad',
  primaryFixed: '#9df6b9',       // Verde menta — badge GRATUITO
  primaryFixedDim: '#81d99f',
  onPrimaryFixed: '#00210f',
  onPrimaryFixedVariant: '#00522d',

  // Secondary (roxo — badges RENAME, Vacinas)
  secondary: '#7448a9',
  secondaryContainer: '#c596fe',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#532688',
  secondaryFixed: '#eedbff',
  secondaryFixedDim: '#dab9ff',
  onSecondaryFixed: '#2a0053',

  // Tertiary (vermelho — erros, urgência, recall)
  tertiary: '#90000e',
  tertiaryContainer: '#b61b1f',  // Card de urgência VM
  onTertiary: '#ffffff',
  onTertiaryContainer: '#ffc9c3',
  tertiaryFixed: '#ffdad6',
  tertiaryFixedDim: '#ffb4ac',
  onTertiaryFixed: '#410003',
  onTertiaryFixedVariant: '#93000e',

  // Surface system
  background: '#f8faf8',
  surface: '#f8faf8',
  surfaceDim: '#d8dad9',
  surfaceBright: '#f8faf8',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f2',
  surfaceContainer: '#eceeec',
  surfaceContainerHigh: '#e6e9e7',
  surfaceContainerHighest: '#e1e3e1',
  surfaceVariant: '#e1e3e1',
  surfaceTint: '#046d3e',

  // On-surface
  onSurface: '#191c1b',
  onSurfaceVariant: '#3f4941',
  onBackground: '#191c1b',

  // Inverse
  inverseSurface: '#2e3130',
  inverseOnSurface: '#eff1ef',
  inversePrimary: '#81d99f',

  // Status
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // Outline
  outline: '#6f7a70',
  outlineVariant: '#bec9be',
} as const;

// ─── TIPOGRAFIA — Public Sans ────────────────────────────────────────────────
export const fonts = {
  displayLarge: { fontSize: 44, fontWeight: '900' as const, letterSpacing: -1.5 },
  displayMedium: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
  headlineLarge: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  headlineMedium: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.25 },
  headlineSmall: { fontSize: 20, fontWeight: '700' as const },
  titleLarge: { fontSize: 18, fontWeight: '700' as const },
  titleMedium: { fontSize: 16, fontWeight: '700' as const },
  bodyLarge: { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  labelLarge: { fontSize: 13, fontWeight: '700' as const, letterSpacing: 1.2 },
  labelSmall: { fontSize: 11, fontWeight: '900' as const, letterSpacing: 1.5 },
} as const;

// ─── SPACING ────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ─── BORDAS ─────────────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 28,   // Cards principais
  '3xl': 32,   // Cards hero (detalhes remédio)
  full: 9999,
} as const;

// ─── SOMBRAS ─────────────────────────────────────────────────────────────────
export const shadows = {
  xs: {
    shadowColor: '#191c1b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sm: {
    shadowColor: '#006b3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  md: {
    shadowColor: '#006b3c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  navBar: {
    shadowColor: '#006b3c',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// Alias de compatibilidade para código existente
export { colors as theme };
export const MIN_TOUCH = 48;
