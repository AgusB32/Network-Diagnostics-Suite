/**
 * Dashboard Screen — home overview.
 * Shows connectivity status, quick stats, and navigation shortcuts.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Metric, Badge } from '../components/atoms';
import { Colors, Spacing, Typography, Radius, CommonStyles } from '../theme';
import { connectivity, deviceRepo, reportRepo, outboxRepo } from '../../application/container';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
}

const QUICK_ACTIONS = [
  { tag: 'SCAN', label: 'Scan Network', route: 'DeviceScan' as const, color: Colors.primary },
  { tag: 'NEW', label: 'New Report', route: 'CreateReport' as const, color: Colors.accent },
  { tag: 'LIST', label: 'Reports', route: 'Reports' as const, color: Colors.success },
];

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [deviceCount, setDeviceCount] = useState<number | string>('—');
  const [reportCount, setReportCount] = useState<number | string>('—');

  // Pulse animation for status indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = connectivity.onConnectivityChange(setIsOnline);
    connectivity.isConnected().then(setIsOnline);
    return unsubscribe;
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const [devices, reports, pending] = await Promise.all([
          deviceRepo.findAll(),
          reportRepo.findAll(),
          outboxRepo.findPending(),
        ]);
        setDeviceCount(devices.length);
        setReportCount(reports.length);
        setPendingSync(pending.length);
      } catch (err) {
        console.warn('Failed to load dashboard metrics:', err);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline, pulseAnim]);

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <ScrollView
        style={CommonStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={Typography.h1}>Network</Text>
            <Text style={[Typography.h1, { color: Colors.primary }]}>Diagnostics</Text>
          </View>
          <View style={styles.onlineIndicator}>
            <Animated.View
              style={[
                styles.onlinePulse,
                {
                  backgroundColor: isOnline ? Colors.online : Colors.offline,
                  transform: [{ scale: pulseAnim }],
                  opacity: isOnline ? 0.3 : 0,
                },
              ]}
            />
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: isOnline ? Colors.online : Colors.offline },
              ]}
            />
          </View>
        </View>

        {/* Connectivity banner */}
        <View style={[styles.banner, { borderColor: isOnline ? Colors.success : Colors.warning }]}>
          <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
            <Text style={Typography.h4}>{isOnline ? 'Online Connected' : 'Offline Mode'}</Text>
            <Text style={Typography.body}>
              {isOnline
                ? 'Ready for network diagnostics'
                : 'Working offline — data will sync when connected'}
            </Text>
          </View>
          <Badge
            label={isOnline ? 'Live' : 'Offline'}
            variant={isOnline ? 'success' : 'warning'}
          />
        </View>

        {/* Quick Actions */}
        <Text style={[Typography.label, styles.sectionLabel]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.route}
              style={[styles.quickAction, { borderColor: action.color + '44' }]}
              onPress={() => navigation.navigate(action.route as any)}
              activeOpacity={0.75}
            >
              <Text style={[styles.quickActionIcon, { color: action.color }]}>{action.tag}</Text>
              <Text style={[Typography.bodySmall, { marginTop: Spacing.xs, color: action.color }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <Text style={[Typography.label, styles.sectionLabel]}>Overview</Text>
        <View style={styles.metricsRow}>
          <Metric label="Devices" value={deviceCount} color={Colors.primary} />
          <View style={{ width: Spacing.sm }} />
          <Metric label="Pending Sync" value={pendingSync} color={Colors.warning} />
          <View style={{ width: Spacing.sm }} />
          <Metric label="Reports" value={reportCount} color={Colors.success} />
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={Typography.h4}>Getting Started</Text>
          <Text style={[Typography.body, { marginTop: Spacing.sm }]}>
            1. Tap <Text style={{ color: Colors.primary }}>Scan Network</Text> to discover LAN devices{'\n'}
            2. Select a device to query via SNMP or SSH{'\n'}
            3. Scan a QR code to associate asset tags{'\n'}
            4. Create installation reports with photos + GPS
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  onlineIndicator: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
  },
  onlinePulse: {
    width: 34,
    height: 34,
    borderRadius: 17,
    position: 'absolute',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickAction: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  quickActionIcon: { fontSize: 28 },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoCard: { marginHorizontal: Spacing.md },
});
