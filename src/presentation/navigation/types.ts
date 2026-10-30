/**
 * Navigation type definitions for type-safe route params.
 */
import type { Device } from '../../domain/entities/Device';

export type RootStackParamList = {
  Dashboard: undefined;
  DeviceScan: undefined;
  DeviceDetail: { device: Device };
  SnmpQuery: { device: Device };
  SshDiagnostics: { device: Device };
  QrScanner: { device?: Device } | undefined;
  CreateReport: { device?: Device } | undefined;
  Reports: undefined;
  Settings: undefined;
};
