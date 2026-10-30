/**
 * Report repository — WatermelonDB implementation of IReportRepository.
 * Manages offline persistence for installation reports and diagnostic data (RF-08).
 */
import { Q } from '@nozbe/watermelondb';
import { database } from '../database/database';
import { InstallationReportModel } from '../database/models';
import type { IReportRepository } from '../../domain/repositories';
import type { InstallationReport, SyncStatus } from '../../domain/entities/InstallationReport';

function toEntity(model: InstallationReportModel): InstallationReport {
  return {
    id: model.id,
    siteName: model.siteName,
    technicianName: model.technicianName,
    notes: model.notes,
    deviceId: model.deviceId ?? undefined,
    deviceIp: model.deviceIp ?? undefined,
    photos: JSON.parse(model.photosJson || '[]'),
    location: model.locationJson ? JSON.parse(model.locationJson) : undefined,
    syncStatus: (model.syncState as SyncStatus) || 'pending',
    pdfPath: model.pdfPath ?? undefined,
    createdAt: new Date(model.createdAt),
  };
}

export class ReportRepository implements IReportRepository {
  private get collection() {
    return database.get<InstallationReportModel>('installation_reports');
  }

  async save(report: InstallationReport): Promise<void> {
    await database.write(async () => {
      const existing = await this.collection.query(Q.where('id', report.id)).fetch();

      if (existing.length > 0) {
        await existing[0].update(record => {
          record.siteName = report.siteName;
          record.technicianName = report.technicianName;
          record.notes = report.notes;
          record.deviceId = report.deviceId ?? null;
          record.deviceIp = report.deviceIp ?? null;
          record.photosJson = JSON.stringify(report.photos);
          record.locationJson = report.location ? JSON.stringify(report.location) : null;
          record.syncState = report.syncStatus;
          record.pdfPath = report.pdfPath ?? null;
          record.createdAt = report.createdAt.getTime();
        });
      } else {
        await this.collection.create(record => {
          record._raw.id = report.id;
          record.siteName = report.siteName;
          record.technicianName = report.technicianName;
          record.notes = report.notes;
          record.deviceId = report.deviceId ?? null;
          record.deviceIp = report.deviceIp ?? null;
          record.photosJson = JSON.stringify(report.photos);
          record.locationJson = report.location ? JSON.stringify(report.location) : null;
          record.syncState = report.syncStatus;
          record.pdfPath = report.pdfPath ?? null;
          record.createdAt = report.createdAt.getTime();
        });
      }
    });
  }

  async findById(id: string): Promise<InstallationReport | null> {
    try {
      const model = await this.collection.find(id);
      return toEntity(model);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<InstallationReport[]> {
    const models = await this.collection.query().fetch();
    return models.map(toEntity);
  }

  async findPending(): Promise<InstallationReport[]> {
    const models = await this.collection
      .query(Q.where('sync_status', 'pending'))
      .fetch();
    return models.map(toEntity);
  }

  async updateSyncStatus(id: string, status: SyncStatus): Promise<void> {
    await database.write(async () => {
      const model = await this.collection.find(id);
      await model.update(record => {
        record.syncState = status;
      });
    });
  }

  async delete(id: string): Promise<void> {
    await database.write(async () => {
      const model = await this.collection.find(id);
      await model.destroyPermanently();
    });
  }
}
