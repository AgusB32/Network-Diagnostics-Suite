/**
 * ScanProgressBar — animated progress indicator for subnet scan.
 * Shows current IP being probed and progress percentage.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography, Radius } from '../../theme';

interface ScanProgressBarProps {
  progress: number; // 0.0 - 1.0
  currentIp?: string;
  devicesFound?: number;
}

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({
  progress, currentIp, devicesFound = 0,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.label}>Scanning Network</Text>
        <Text style={[Typography.bodySmall, { color: Colors.primary }]}>
          {devicesFound} device{devicesFound !== 1 ? 's' : ''} found
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            { width },
          ]}
        />
      </View>
      {currentIp ? (
        <Text style={[Typography.mono, styles.ipText]}>→ {currentIp}</Text>
      ) : null}
      <Text style={[Typography.caption, { textAlign: 'right', marginTop: 4 }]}>
        {Math.round(progress * 100)}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  track: {
    height: 6,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  ipText: {
    marginTop: Spacing.xs,
    color: Colors.textMuted,
    fontSize: 11,
  },
});
