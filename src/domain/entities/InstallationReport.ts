// Domain Entity — Installation report
export interface InstallationReport {
  id: string;
  siteId?: string;
  siteName: string;
  technicianName: string;
  notes: string;
  deviceId?: string;
  deviceIp?: string;
  photos: Photo[];
  location?: GeoLocation;
  createdAt: Date;
  syncStatus: SyncStatus;
  pdfPath?: string;
}

export interface Photo {
  id: string;
  uri: string;
  caption?: string;
  location?: GeoLocation;
  takenAt: Date;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: Date;
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface OutboxEntry {
  id: string;
  type: 'report' | 'diagnostic' | 'device_update';
  payload: unknown;
  attempts: number;
  lastAttemptAt?: Date;
  createdAt: Date;
  status: SyncStatus;
  errorMessage?: string;
}
