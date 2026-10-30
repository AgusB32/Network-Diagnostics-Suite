/**
 * DeviceScanScreen — RF-01: scan LAN, list active devices.
 * Uses ScanNetworkUseCase. Detects local subnet from device IP.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Button, EmptyState, SectionHeader } from '../components/atoms';
import { DeviceCard } from '../components/molecules/DeviceCard';
import { ScanProgressBar } from '../components/molecules/ScanProgressBar';
import { Colors, Spacing, Typography, CommonStyles, Radius } from '../theme';
import { scanNetwork } from '../../application/container';
import type { Device } from '../../domain/entities/Device';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DeviceScan'>;
}

export const DeviceScanScreen: React.FC<Props> = ({ navigation }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [scanStats, setScanStats] = useState<{ mdns: number; arp: number; ms: number } | null>(null);

  const detectSubnet = useCallback(async () => {
    const state = await NetInfo.fetch();
    const ip = (state as any)?.details?.ipAddress as string | undefined;
    if (ip) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        setSubnet(`${parts[0]}.${parts[1]}.${parts[2]}.0/24`);
      }
    }
  }, []);

  const handleScan = useCallback(async () => {
    setScanning(true);
    setDevices([]);
    setProgress(0);
    setScanStats(null);

    // Simulate progress updates (real implementation would hook into scanner)
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 0.05, 0.95));
    }, 500);

    try {
      const result = await scanNetwork.execute(subnet);
      clearInterval(progressInterval);
      setProgress(1);
      setDevices(result.devices);
      setScanStats({ mdns: result.mdnsDevices, arp: result.arpDevices, ms: result.durationMs });
    } catch (err: any) {
      clearInterval(progressInterval);
      Alert.alert('Scan Failed', err?.message ?? 'Unknown error');
    } finally {
      setScanning(false);
    }
  }, [subnet]);

  const renderDevice = useCallback(
    ({ item }: { item: Device }) => (
      <DeviceCard
        device={item}
        onPress={() => navigation.navigate('DeviceDetail', { device: item })}
        onSnmpPress={() => navigation.navigate('SnmpQuery', { device: item })}
        onSshPress={() => navigation.navigate('SshDiagnostics', { device: item })}
      />
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <View style={CommonStyles.screen}>
        {/* Subnet input */}
        <View style={styles.inputSection}>
          <Text style={[Typography.label, { marginBottom: Spacing.xs }]}>Subnet (CIDR)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[CommonStyles.textInput, styles.subnetInput]}
              value={subnet}
              onChangeText={setSubnet}
              placeholder="e.g. 192.168.1.0/24"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="default"
            />
            <Button
              label="Auto"
              onPress={detectSubnet}
              variant="ghost"
              style={styles.autoBtn}
            />
          </View>
        </View>

        {/* Scan button */}
        <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.md }}>
          <Button
            label={scanning ? 'Scanning…' : 'Start Scan'}
            onPress={handleScan}
            loading={scanning}
            variant="primary"
          />
        </View>

        {/* Progress */}
        {scanning && (
          <ScanProgressBar
            progress={progress}
            devicesFound={devices.length}
          />
        )}

        {/* Stats */}
        {scanStats && !scanning && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={Typography.h3}>{devices.length}</Text>
              <Text style={Typography.caption}>Devices</Text>
            </View>
            <View style={styles.stat}>
              <Text style={Typography.h3}>{scanStats.mdns}</Text>
              <Text style={Typography.caption}>mDNS</Text>
            </View>
            <View style={styles.stat}>
              <Text style={Typography.h3}>{scanStats.arp}</Text>
              <Text style={Typography.caption}>Probed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[Typography.h3, { color: Colors.primary }]}>
                {(scanStats.ms / 1000).toFixed(1)}s
              </Text>
              <Text style={Typography.caption}>Duration</Text>
            </View>
          </View>
        )}

        {/* Device list */}
        <FlatList
          data={devices}
          keyExtractor={d => d.id}
          renderItem={renderDevice}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          ListHeaderComponent={
            devices.length > 0 ? (
              <SectionHeader
                title={`Discovered Devices (${devices.length})`}
                subtitle={`Subnet: ${subnet}`}
              />
            ) : undefined
          }
          ListEmptyComponent={
            !scanning ? (
              <EmptyState
                title="No Devices Found"
                message="Start a scan to discover active devices on your local network"
              />
            ) : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  inputSection: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  subnetInput: { flex: 1 },
  autoBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  stat: { alignItems: 'center' },
});
