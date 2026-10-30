/**
 * Design System — tokens, palette, typography, spacing.
 * Single source of truth for all UI styling.
 * Dark mode focused with teal/electric blue accent palette.
 */
import { StyleSheet } from 'react-native';

export const Colors = {
  // Primary palette — deep navy/teal
  primary: '#0ea5e9',         // Sky-500
  primaryDark: '#0369a1',     // Sky-700
  primaryLight: '#38bdf8',    // Sky-400
  accent: '#f97316',          // Orange-500 — alert/action
  accentLight: '#fb923c',

  // Backgrounds (dark theme)
  bg: '#0a0f1e',              // near-black navy
  bgCard: '#111827',          // gray-900
  bgElevated: '#1f2937',      // gray-800
  bgInput: '#1a2332',

  // Borders
  border: '#1e3a5f',
  borderLight: '#374151',

  // Text
  textPrimary: '#f1f5f9',     // slate-100
  textSecondary: '#94a3b8',   // slate-400
  textMuted: '#475569',       // slate-600
  textInverse: '#0a0f1e',

  // Semantic
  success: '#22c55e',         // green-500
  warning: '#eab308',         // yellow-500
  error: '#ef4444',           // red-500
  info: '#0ea5e9',

  // Status indicators
  online: '#22c55e',
  offline: '#ef4444',
  unknown: '#6b7280',

  // Gradient stops
  gradientStart: '#0f172a',
  gradientEnd: '#0a0f1e',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5, color: Colors.textPrimary },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, color: Colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: Colors.textPrimary },
  h4: { fontSize: 15, fontWeight: '600' as const, color: Colors.textPrimary },
  body: { fontSize: 14, fontWeight: '400' as const, color: Colors.textSecondary },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, color: Colors.textSecondary },
  caption: { fontSize: 11, fontWeight: '400' as const, color: Colors.textMuted },
  label: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 1, textTransform: 'uppercase' as const, color: Colors.textMuted },
  mono: { fontSize: 12, fontFamily: 'monospace', color: Colors.textPrimary },
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;

export const CommonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
  textInput: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm + 4,
    color: Colors.textPrimary,
    fontSize: 14,
  },
});
