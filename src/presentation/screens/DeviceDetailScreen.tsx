/**
 * DeviceDetailScreen — Detailed view of a discovered device.
 * Provides access to SNMP, SSH, QR tagging, and shows diagnostic history (RF-08).
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge, SectionHeader } from '../components/atoms';
import { Colors, Spacing, Typography, CommonStyles } from '../theme';
import { reportRepo } from '../../application/container';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import type { InstallationReport } from '../../domain/entities/InstallationReport';

interface Props {
  route: RouteProp<RootStackParamList, 'DeviceDetail'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeviceDetail'>;
}

export const DeviceDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { device } = route.params;
  const [reports, setReports] = useState<InstallationReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function loadDeviceReports() {
      try {
        const allReports = await reportRepo.findAll();
        const related = allReports.filter(
          r => r.deviceId === device.id || r.deviceIp === device.ip,
        );
        setReports(related);
      } catch (err) {
        console.warn('Failed to load device history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadDeviceReports();
  }, [device]);

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <ScrollView
        style={CommonStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Header */}
        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.flex1}>
              <Text style={Typography.h2}>{device.ip}</Text>
              {device.hostname ? (
                <Text style={[Typography.body, { marginTop: 2 }]}>{device.hostname}</Text>
              ) : null}
            </View>
            <Badge
              label={device.isOnline ? 'Online' : 'Offline'}
              variant={device.isOnline ? 'success' : 'neutral'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={Typography.label}>MAC Address</Text>
              <Text style={Typography.mono}>{device.mac ?? 'Not available'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={Typography.label}>Vendor</Text>
              <Text style={Typography.body}>{device.vendor ?? 'Standard Network Node'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={Typography.label}>Asset Tag</Text>
              <Text style={Typography.mono}>{device.assetTag ?? 'Unassigned'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={Typography.label}>Last Seen</Text>
              <Text style={Typography.caption}>{new Date(device.lastSeen).toLocaleString()}</Text>
            </View>
          </View>

          {device.technicalSheetUrl ? (
            <Button
              label="Open Technical Sheet"
              onPress={() => Linking.openURL(device.technicalSheetUrl!)}
              variant="ghost"
              style={{ marginTop: Spacing.sm }}
            />
          ) : null}
        </Card>

        {/* Diagnostic Actions */}
        <SectionHeader title="Diagnostics & Tools" />
        <View style={styles.actionsGrid}>
          <Button
            label="SNMP Query"
            onPress={() => navigation.navigate('SnmpQuery', { device })}
            variant="primary"
            style={styles.actionBtn}
          />
          <Button
            label="SSH Diagnostics"
            onPress={() => navigation.navigate('SshDiagnostics', { device })}
            variant="secondary"
            style={styles.actionBtn}
          />
          <Button
            label={device.assetTag ? 'Re-scan QR Tag' : 'Scan QR Tag'}
            onPress={() => navigation.navigate('QrScanner', { device })}
            variant="ghost"
            style={styles.actionBtn}
          />
          <Button
            label="New Installation Report"
            onPress={() => navigation.navigate('CreateReport', { device })}
            variant="ghost"
            style={styles.actionBtn}
          />
        </View>

        {/* Offline Diagnostic & Installation History (RF-08) */}
        <SectionHeader
          title="Diagnostic & Installation History"
          subtitle={`${reports.length} records found offline`}
        />

        {loadingHistory ? (
          <Text style={[Typography.caption, styles.centeredText]}>Loading history…</Text>
        ) : reports.length === 0 ? (
          <Card style={styles.card}>
            <Text style={[Typography.body, { textAlign: 'center' }]}>
              No previous reports registered for this device yet.
            </Text>
          </Card>
        ) : (
          reports.map(report => (
            <Card key={report.id} style={styles.historyCard}>
              <View style={styles.rowBetween}>
                <Text style={Typography.h4}>{report.siteName}</Text>
                <Badge
                  label={report.syncStatus.toUpperCase()}
                  variant={report.syncStatus === 'synced' ? 'success' : 'warning'}
                />
              </View>
              <Text style={[Typography.caption, { marginTop: 2 }]}>
                Tech: {report.technicianName} • {new Date(report.createdAt).toLocaleDateString()}
              </Text>
              {report.notes ? (
                <Text style={[Typography.bodySmall, { marginTop: Spacing.xs }]}>
                  {report.notes}
                </Text>
              ) : null}
              {report.pdfPath ? (
                <Text style={[Typography.caption, { marginTop: Spacing.xs, color: Colors.primary }]}>
                  PDF: {report.pdfPath.split('/').pop()}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex1: { flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  metaGrid: { gap: Spacing.sm },
  metaItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actionsGrid: { paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg },
  actionBtn: { width: '100%' },
  historyCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  centeredText: { textAlign: 'center', marginVertical: Spacing.md },
});
