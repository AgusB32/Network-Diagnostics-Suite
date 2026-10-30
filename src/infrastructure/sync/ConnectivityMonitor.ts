/**
 * Connectivity monitor — wraps @react-native-community/netinfo.
 * Triggers automatic outbox sync when connection is restored (RF-07).
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import type { IConnectivityMonitor } from '../../domain/ports';

export class ConnectivityMonitor implements IConnectivityMonitor {
  async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  }

  onConnectivityChange(callback: (connected: boolean) => void): () => void {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      callback(connected);
    });
    return unsubscribe;
  }
}
