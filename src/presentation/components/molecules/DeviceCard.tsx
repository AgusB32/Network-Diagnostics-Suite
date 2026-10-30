/**
 * DeviceCard — molecule component.
 * Displays a discovered device with IP, hostname, status indicator,
 * and quick-action buttons for SNMP query and SSH connect.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusDot, Badge, Card } from '../atoms';
import { Colors, Spacing, Typography, Radius } from '../../theme';
import type { Device } from '../../../domain/entities/Device';

interface DeviceCardProps {
  device: Device;
  onSnmpPress?: () => void;
  onSshPress?: () => void;
  onPress?: () => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device, onSnmpPress, onSshPress, onPress,
}) => {
  const lastSeenLabel = device.lastSeen
    ? `${Math.round((Date.now() - device.lastSeen.getTime()) / 1000)}s ago`
    : '—';

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <StatusDot online={device.isOnline} size={12} />
          <View style={{ marginLeft: Spacing.sm }}>
            <Text style={Typography.h4}>{device.ip}</Text>
            {device.hostname ? (
              <Text style={[Typography.body, { marginTop: 2 }]}>{device.hostname}</Text>
            ) : (
              <Text style={[Typography.caption, { fontStyle: 'italic' }]}>No hostname</Text>
            )}
          </View>
        </View>
        <Badge
          label={device.isOnline ? 'Online' : 'Offline'}
          variant={device.isOnline ? 'success' : 'error'}
        />
      </View>

      {/* Metadata row */}
      <View style={styles.metaRow}>
        {device.mac ? (
          <View style={styles.metaItem}>
            <Text style={Typography.label}>MAC</Text>
            <Text style={[Typography.mono, { marginTop: 2 }]}>{device.mac}</Text>
          </View>
        ) : null}
        {device.vendor ? (
          <View style={styles.metaItem}>
            <Text style={Typography.label}>Vendor</Text>
            <Text style={[Typography.body, { marginTop: 2 }]}>{device.vendor}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Text style={Typography.label}>Last Seen</Text>
          <Text style={[Typography.body, { marginTop: 2 }]}>{lastSeenLabel}</Text>
        </View>
      </View>

      {device.assetTag ? (
        <View style={styles.assetBadge}>
          <Text style={Typography.label}>🏷 Asset: </Text>
          <Text style={Typography.bodySmall}>{device.assetTag}</Text>
        </View>
      ) : null}

      {/* Quick actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: Colors.primary }]}
          onPress={onSnmpPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>SNMP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: Colors.accentLight }]}
          onPress={onSshPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionBtnText, { color: Colors.accentLight }]}>SSH</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: { flex: 1 },
  assetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
});
