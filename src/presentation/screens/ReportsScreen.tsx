/**
 * ReportsScreen — RF-08: Offline list of all installation reports.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Badge, Button, SectionHeader, EmptyState } from '../components/atoms';
import { Colors, Spacing, Typography, CommonStyles } from '../theme';
import { reportRepo } from '../../application/container';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { InstallationReport } from '../../domain/entities/InstallationReport';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Reports'>;
}

export const ReportsScreen: React.FC<Props> = ({ navigation }) => {
  const [reports, setReports] = useState<InstallationReport[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const data = await reportRepo.findAll();
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReports(data);
    } catch (err) {
      console.warn('Failed to fetch offline reports:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const renderItem = ({ item }: { item: InstallationReport }) => {
    const isSynced = item.syncStatus === 'synced';
    return (
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={Typography.h3}>{item.siteName}</Text>
          <Badge
            label={item.syncStatus.toUpperCase()}
            variant={isSynced ? 'success' : 'warning'}
          />
        </View>

        <Text style={[Typography.body, { marginTop: Spacing.xs }]}>
          Technician: {item.technicianName}
        </Text>

        {item.deviceIp ? (
          <Text style={[Typography.caption, { marginTop: 2 }]}>
            Associated Host: {item.deviceIp}
          </Text>
        ) : null}

        {item.location ? (
          <Text style={[Typography.caption, { marginTop: 2 }]}>
            GPS: {item.location.latitude.toFixed(5)}, {item.location.longitude.toFixed(5)}
          </Text>
        ) : null}

        {item.notes ? (
          <Text style={[Typography.bodySmall, { marginTop: Spacing.sm, color: Colors.textSecondary }]}>
            {item.notes}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={Typography.caption}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
          {item.pdfPath ? (
            <Badge label="PDF Generated" variant="primary" />
          ) : (
            <Badge label="No PDF" variant="neutral" />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <View style={[CommonStyles.screen, { paddingHorizontal: Spacing.md }]}>
        <SectionHeader
          title="Installation Reports"
          subtitle={`${reports.length} reports stored offline`}
          action={
            <Button
              label="New Report"
              onPress={() => navigation.navigate('CreateReport')}
              variant="primary"
            />
          }
        />

        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Reports Yet"
              message="Register your first installation with GPS, photos, and notes"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
