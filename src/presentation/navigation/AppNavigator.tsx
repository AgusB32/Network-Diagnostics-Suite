/**
 * App Navigator — root navigation stack.
 * Uses React Navigation v6 native stack for native performance.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DashboardScreen } from '../screens/DashboardScreen';
import { DeviceScanScreen } from '../screens/DeviceScanScreen';
import { DeviceDetailScreen } from '../screens/DeviceDetailScreen';
import { SnmpQueryScreen } from '../screens/SnmpQueryScreen';
import { SshDiagnosticsScreen } from '../screens/SshDiagnosticsScreen';
import { QrScannerScreen } from '../screens/QrScannerScreen';
import { CreateReportScreen } from '../screens/CreateReportScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { Colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.bgCard },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { color: Colors.textPrimary, fontWeight: '600' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.bg },
};

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Dashboard">
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeviceScan"
        component={DeviceScanScreen}
        options={{ title: 'Network Scanner' }}
      />
      <Stack.Screen
        name="DeviceDetail"
        component={DeviceDetailScreen}
        options={{ title: 'Device Details' }}
      />
      <Stack.Screen
        name="SnmpQuery"
        component={SnmpQueryScreen}
        options={{ title: 'SNMP Query' }}
      />
      <Stack.Screen
        name="SshDiagnostics"
        component={SshDiagnosticsScreen}
        options={{ title: 'SSH Diagnostics' }}
      />
      <Stack.Screen
        name="QrScanner"
        component={QrScannerScreen}
        options={{ title: 'QR / Barcode Scanner', headerTransparent: true }}
      />
      <Stack.Screen
        name="CreateReport"
        component={CreateReportScreen}
        options={{ title: 'New Report' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Installation Reports' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);
