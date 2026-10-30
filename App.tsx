/**
 * Root App component.
 * Bootstraps the offline sync listener on mount.
 * Triggers outbox sync automatically when connectivity is restored (RF-07).
 */
import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/presentation/navigation/AppNavigator';
import { connectivity, syncOutbox } from './src/application/container';
import { Colors } from './src/presentation/theme';

export default function App() {
  useEffect(() => {
    // Outbox Pattern: auto-sync when connection is restored
    const unsubscribe = connectivity.onConnectivityChange(async (isOnline) => {
      if (isOnline) {
        console.log('[App] Connectivity restored — flushing outbox…');
        try {
          const result = await syncOutbox.syncPendingEntries();
          console.log(`[App] Sync complete: ${result.succeeded} ok, ${result.failed} failed`);
        } catch (err) {
          console.warn('[App] Sync error:', err);
        }
      }
    });

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
