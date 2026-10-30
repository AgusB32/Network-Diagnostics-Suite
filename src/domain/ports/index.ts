// Port interfaces for infrastructure services (ISP — Interface Segregation)
import type { Device, SnmpData, SshDiagnosticResult } from '../entities/Device';
import type { GeoLocation } from '../entities/InstallationReport';

// Discovery Layer port
export interface INetworkScanner {
  scanSubnet(subnet: string): Promise<Device[]>;
  discoverMdns(): Promise<Device[]>;
}

// Protocol Layer ports
export interface ISnmpClient {
  query(host: string, community: string, oids: string[]): Promise<SnmpData>;
  getSystemInfo(host: string, community: string): Promise<SnmpData>;
}

export interface ISshClient {
  connect(host: string, port: number, credentials: SshCredentials): Promise<void>;
  executeCommands(commands: string[]): Promise<SshDiagnosticResult>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface SshCredentials {
  username: string;
  password?: string;
  privateKey?: string;
}

// Evidence Layer ports
export interface IGeolocationService {
  getCurrentLocation(): Promise<GeoLocation>;
  requestPermission(): Promise<boolean>;
}

export interface ICredentialStore {
  save(key: string, username: string, password: string): Promise<void>;
  load(key: string): Promise<{ username: string; password: string } | null>;
  delete(key: string): Promise<void>;
}

export interface IPdfGenerator {
  generate(html: string, fileName: string): Promise<string>; // returns file path
}

// Sync Layer port
export interface ISyncService {
  syncPendingEntries(): Promise<{ succeeded: number; failed: number }>;
}

export interface IConnectivityMonitor {
  isConnected(): Promise<boolean>;
  onConnectivityChange(callback: (connected: boolean) => void): () => void;
}
