/**
 * Atomic components — building blocks for all screens.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../theme';

// ─── StatusDot ───────────────────────────────────────────────────────────────
interface StatusDotProps {
  online: boolean;
  size?: number;
}
export const StatusDot: React.FC<StatusDotProps> = ({ online, size = 10 }) => (
  <View
    style={[
      styles.statusDot,
      { width: size, height: size, borderRadius: size / 2 },
      { backgroundColor: online ? Colors.online : Colors.offline },
    ]}
  />
);

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}
export const Badge: React.FC<BadgeProps> = ({ label, variant = 'primary' }) => {
  const bg = {
    primary: Colors.primary,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    neutral: Colors.bgElevated,
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
};

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', loading, disabled, style, icon,
}) => {
  const isDisabled = disabled || loading;
  const containerStyle = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'ghost' && styles.buttonGhost,
    variant === 'danger' && styles.buttonDanger,
    isDisabled && styles.buttonDisabled,
    style,
  ];
  const textStyle = [
    styles.buttonText,
    variant === 'ghost' && { color: Colors.primary },
    variant === 'secondary' && { color: Colors.textPrimary },
    isDisabled && { opacity: 0.5 },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={textStyle}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}
export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ─── SectionHeader ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.flex1}>
      <Text style={Typography.label}>{title}</Text>
      {subtitle ? <Text style={[Typography.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
    </View>
    {action}
  </View>
);

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}
export const EmptyState: React.FC<EmptyStateProps> = ({ title, message, action }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIconWrap}>
      <Text style={styles.emptyIcon}>📡</Text>
    </View>
    <Text style={[Typography.h3, { textAlign: 'center', marginTop: Spacing.md }]}>{title}</Text>
    <Text style={[Typography.body, { textAlign: 'center', marginTop: Spacing.sm }]}>{message}</Text>
    {action ? <View style={{ marginTop: Spacing.lg }}>{action}</View> : null}
  </View>
);

// ─── Metric ──────────────────────────────────────────────────────────────────
interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}
export const Metric: React.FC<MetricProps> = ({ label, value, unit, color }) => (
  <View style={styles.metric}>
    <Text style={Typography.label}>{label}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
      <Text style={[Typography.h2, color ? { color } : {}]}>{value}</Text>
      {unit ? <Text style={[Typography.caption, { marginLeft: 4 }]}>{unit}</Text> : null}
    </View>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  statusDot: { marginRight: Spacing.xs },
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  buttonSecondary: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  buttonDanger: {
    backgroundColor: Colors.error,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    ...Typography.h4,
    color: 'white',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  flex1: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: { fontSize: 36 },
  metric: {
    flex: 1,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
