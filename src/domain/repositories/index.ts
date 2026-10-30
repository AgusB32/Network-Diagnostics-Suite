// Repository interfaces — Dependency Inversion (SOLID D)
import type { Device } from '../entities/Device';
import type { InstallationReport, OutboxEntry } from '../entities/InstallationReport';

export interface IDeviceRepository {
  save(device: Device): Promise<void>;
  saveMany(devices: Device[]): Promise<void>;
  findById(id: string): Promise<Device | null>;
  findByIp(ip: string): Promise<Device | null>;
  findAll(): Promise<Device[]>;
  delete(id: string): Promise<void>;
}

export interface IReportRepository {
  save(report: InstallationReport): Promise<void>;
  findById(id: string): Promise<InstallationReport | null>;
  findAll(): Promise<InstallationReport[]>;
  findPending(): Promise<InstallationReport[]>;
  updateSyncStatus(id: string, status: InstallationReport['syncStatus']): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IOutboxRepository {
  enqueue(entry: Omit<OutboxEntry, 'id' | 'createdAt' | 'attempts'>): Promise<OutboxEntry>;
  findPending(): Promise<OutboxEntry[]>;
  markSuccess(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  incrementAttempt(id: string): Promise<void>;
  deleteProcessed(): Promise<void>;
}
