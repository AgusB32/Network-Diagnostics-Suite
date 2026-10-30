/**
 * SnmpQueryScreen — RF-02: query SNMP OIDs for a target device.
 * Shows sysName, sysDescr, uptime, interfaces.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge, Metric } from '../components/atoms';
import { Colors, Spacing, Typography, CommonStyles, Radius } from '../theme';
import { querySnmp } from '../../application/container';
import type { SnmpData } from '../../domain/entities/Device';
import type { Device } from '../../domain/entities/Device';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

interface Props {
  route: RouteProp<RootStackParamList, 'SnmpQuery'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'SnmpQuery'>;
}

function formatUptime(centiseconds: number): string {
  const totalSec = Math.floor(centiseconds / 100);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const parts = [];
  if (days > 0) {parts.push(`${days}d`);}
  if (hours > 0) {parts.push(`${hours}h`);}
  parts.push(`${mins}m`);
  return parts.join(' ');
}

export const SnmpQueryScreen: React.FC<Props> = ({ route }) => {
  const { device } = route.params;
  const [community, setCommunity] = useState('public');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SnmpData | null>(null);

  const handleQuery = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const data = await querySnmp.execute({
        deviceId: device.id,
        host: device.ip,
        community,
      });
      setResult(data);
    } catch (err: any) {
      Alert.alert(
        'SNMP Query Failed',
        err?.message ?? 'Check that SNMP is enabled on this device and the community string is correct.',
      );
    } finally {
      setLoading(false);
    }
  }, [device, community]);

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <ScrollView
        style={CommonStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Device header */}
        <Card style={styles.deviceCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={Typography.h3}>{device.ip}</Text>
              {device.hostname && (
                <Text style={[Typography.body, { marginTop: 2 }]}>{device.hostname}</Text>
              )}
            </View>
            <Badge label="SNMP v2c" variant="primary" />
          </View>
        </Card>

        {/* Community string */}
        <View style={styles.section}>
          <Text style={[Typography.label, { marginBottom: Spacing.xs }]}>
            Community String
          </Text>
          <TextInput
            style={CommonStyles.textInput}
            value={community}
            onChangeText={setCommunity}
            placeholder="public"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            secureTextEntry={false}
          />
          <Text style={[Typography.caption, { marginTop: Spacing.xs }]}>
            Security Notice: SNMPv1/v2c transmits community strings in plaintext. Use on trusted LANs only.
          </Text>
        </View>

        <Button
          label={loading ? 'Querying…' : 'Run SNMP Query'}
          onPress={handleQuery}
          loading={loading}
          style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.lg }}
        />

        {/* Results */}
        {result && (
          <>
            {/* System Info */}
            <Text style={[Typography.label, styles.sectionLabel]}>System Information</Text>
            <Card style={styles.resultCard}>
              {result.sysName && (
                <View style={styles.field}>
                  <Text style={Typography.label}>System Name</Text>
                  <Text style={[Typography.h4, { marginTop: 4 }]}>{result.sysName}</Text>
                </View>
              )}
              {result.sysDescr && (
                <View style={styles.field}>
                  <Text style={Typography.label}>Description</Text>
                  <Text style={[Typography.body, { marginTop: 4 }]}>{result.sysDescr}</Text>
                </View>
              )}
              {result.sysLocation && (
                <View style={styles.field}>
                  <Text style={Typography.label}>Location</Text>
                  <Text style={[Typography.body, { marginTop: 4 }]}>{result.sysLocation}</Text>
                </View>
              )}
            </Card>

            {/* Uptime */}
            {result.sysUptime !== undefined && (
              <>
                <Text style={[Typography.label, styles.sectionLabel]}>Uptime</Text>
                <Card style={styles.resultCard}>
                  <Text style={[Typography.h2, { color: Colors.primary }]}>
                    {formatUptime(result.sysUptime)}
                  </Text>
                  <Text style={[Typography.caption, { marginTop: 4 }]}>
                    {result.sysUptime} centiseconds since last reboot
                  </Text>
                </Card>
              </>
            )}

            {/* Interfaces */}
            {result.interfaces && result.interfaces.length > 0 && (
              <>
                <Text style={[Typography.label, styles.sectionLabel]}>
                  Interfaces ({result.interfaces.length})
                </Text>
                {result.interfaces.map((iface, i) => (
                  <Card key={i} style={styles.resultCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={Typography.h4}>{iface.name || `ifIndex ${iface.index}`}</Text>
                      <Badge
                        label={iface.operStatus}
                        variant={iface.operStatus === 'up' ? 'success' : 'error'}
                      />
                    </View>
                    <View style={styles.ifaceMetrics}>
                      {iface.inOctets !== undefined && (
                        <Metric
                          label="In"
                          value={(iface.inOctets / 1024 / 1024).toFixed(2)}
                          unit="MB"
                          color={Colors.success}
                        />
                      )}
                      {iface.outOctets !== undefined && (
                        <Metric
                          label="Out"
                          value={(iface.outOctets / 1024 / 1024).toFixed(2)}
                          unit="MB"
                          color={Colors.accent}
                        />
                      )}
                    </View>
                  </Card>
                ))}
              </>
            )}

            {/* Queried at */}
            <Text style={[Typography.caption, styles.timestamp]}>
              Queried at {result.queriedAt.toLocaleTimeString()}
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  deviceCard: { margin: Spacing.md },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionLabel: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  resultCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  field: {
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ifaceMetrics: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  timestamp: { textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
});
