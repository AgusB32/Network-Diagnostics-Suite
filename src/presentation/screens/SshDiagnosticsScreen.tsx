/**
 * SshDiagnosticsScreen — RF-03: connect via SSH and run diagnostic commands.
 * Credentials loaded from SecureCredentialStore.
 * Provides inline credential setup if none found.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Badge } from '../components/atoms';
import { Colors, Spacing, Typography, CommonStyles, Radius } from '../theme';
import { runSshDiagnostics, credentialStore } from '../../application/container';
import type { SshDiagnosticResult, CommandResult } from '../../domain/entities/Device';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

interface Props {
  route: RouteProp<RootStackParamList, 'SshDiagnostics'>;
}

export const SshDiagnosticsScreen: React.FC<Props> = ({ route }) => {
  const { device } = route.params;
  const credKey = `ssh:${device.ip}`;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState('22');
  const [savingCreds, setSavingCreds] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SshDiagnosticResult | null>(null);

  const handleSaveCreds = useCallback(async () => {
    if (!username || !password) {
      Alert.alert('Validation', 'Username and password are required.');
      return;
    }
    setSavingCreds(true);
    try {
      await credentialStore.save(credKey, username, password);
      Alert.alert('Saved', 'Credentials stored securely in Keychain/Keystore.');
    } catch (err: any) {
      Alert.alert('Error', err?.message);
    } finally {
      setSavingCreds(false);
    }
  }, [credKey, username, password]);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await runSshDiagnostics.execute({
        host: device.ip,
        port: parseInt(port, 10),
        credentialKey: credKey,
      });
      setResult(res);
    } catch (err: any) {
      if (err?.message?.includes('No credentials found')) {
        Alert.alert(
          'No Credentials',
          'Enter username and password above and tap "Save Credentials" first.',
        );
      } else {
        Alert.alert('SSH Error', err?.message ?? 'Connection failed');
      }
    } finally {
      setLoading(false);
    }
  }, [device, credKey, port]);

  const renderCommand = (cmd: CommandResult, index: number) => (
    <View key={index} style={styles.commandBlock}>
      <View style={styles.commandHeader}>
        <Text style={styles.commandPrompt}>$ {cmd.command}</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
          <Badge
            label={cmd.exitCode === 0 ? 'OK' : 'ERR'}
            variant={cmd.exitCode === 0 ? 'success' : 'error'}
          />
          <Text style={[Typography.caption, { color: Colors.textMuted, marginLeft: 4 }]}>
            {cmd.durationMs}ms
          </Text>
        </View>
      </View>
      <Text style={styles.commandOutput}>{cmd.output || '(no output)'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <ScrollView
        style={CommonStyles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Target */}
        <Card style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={Typography.h3}>{device.ip}</Text>
              {device.hostname && (
                <Text style={Typography.body}>{device.hostname}</Text>
              )}
            </View>
            <Badge label="SSH" variant="primary" />
          </View>
        </Card>

        {/* Credentials (saved to Keychain — NOT transmitted in logs) */}
        <Card style={styles.card}>
          <Text style={[Typography.label, { marginBottom: Spacing.sm }]}>
            🔐 Credentials (stored in Keychain)
          </Text>
          <TextInput
            style={[CommonStyles.textInput, styles.input]}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
          />
          <TextInput
            style={[CommonStyles.textInput, styles.input]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
          />
          <TextInput
            style={[CommonStyles.textInput, styles.input]}
            value={port}
            onChangeText={setPort}
            placeholder="Port (default: 22)"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
          />
          <Button
            label="Save Credentials"
            onPress={handleSaveCreds}
            loading={savingCreds}
            variant="secondary"
          />
          <Text style={[Typography.caption, { marginTop: Spacing.sm }]}>
            Credentials are encrypted and stored in the device's secure enclave (Keychain/Keystore).
            They are never logged or transmitted unencrypted.
          </Text>
        </Card>

        {/* Run */}
        <Button
          label={loading ? 'Connecting…' : 'Run Diagnostics'}
          onPress={handleConnect}
          loading={loading}
          style={{ marginHorizontal: Spacing.md, marginBottom: Spacing.lg }}
        />

        {/* Results */}
        {result && (
          <>
            <Text style={[Typography.label, styles.sectionLabel]}>
              Diagnostic Output — {result.executedAt.toLocaleTimeString()}
            </Text>
            <View style={styles.terminal}>
              {result.commandsExecuted.map(renderCommand)}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing.xxl },
  card: { margin: Spacing.md },
  input: { marginBottom: Spacing.sm },
  sectionLabel: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  terminal: {
    marginHorizontal: Spacing.md,
    backgroundColor: '#0a0f0a',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '44',
  },
  commandBlock: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgElevated,
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  commandPrompt: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: Colors.success,
    fontWeight: '700',
    flex: 1,
  },
  commandOutput: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#a3e6a3',
    lineHeight: 18,
  },
});
