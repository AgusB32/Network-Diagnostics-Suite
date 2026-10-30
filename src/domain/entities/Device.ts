// Domain Entity — no framework dependencies
export interface Device {
  id: string;
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  lastSeen: Date;
  isOnline: boolean;
  // QR/barcode scanned data
  assetTag?: string;
  technicalSheetUrl?: string;
}

export interface DeviceSnapshot extends Device {
  snmpData?: SnmpData;
  sshOutput?: SshDiagnosticResult;
}

export interface SnmpData {
  sysName?: string;
  sysDescr?: string;
  sysUptime?: number; // centiseconds
  sysLocation?: string;
  interfaces?: NetworkInterface[];
  queriedAt: Date;
}

export interface NetworkInterface {
  index: number;
  name: string;
  type: number;
  mtu?: number;
  speed?: number;
  physAddress?: string;
  adminStatus: 'up' | 'down' | 'testing';
  operStatus: 'up' | 'down' | 'testing' | 'unknown' | 'dormant' | 'notPresent' | 'lowerLayerDown';
  inOctets?: number;
  outOctets?: number;
  inErrors?: number;
  outErrors?: number;
}

export interface SshDiagnosticResult {
  host: string;
  commandsExecuted: CommandResult[];
  executedAt: Date;
}

export interface CommandResult {
  command: string;
  output: string;
  exitCode?: number;
  durationMs: number;
}
