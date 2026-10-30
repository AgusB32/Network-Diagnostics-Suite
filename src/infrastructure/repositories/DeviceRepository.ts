/**
 * Device repository — WatermelonDB implementation of IDeviceRepository.
 * Maps between domain entities and WatermelonDB models.
 */
import { Q } from '@nozbe/watermelondb';
import { database } from '../database/database';
import { DeviceModel } from '../database/models';
import type { IDeviceRepository } from '../../domain/repositories';
import type { Device } from '../../domain/entities/Device';

function toEntity(model: DeviceModel): Device {
  return {
    id: model.id,
    ip: model.ip,
    mac: model.mac ?? undefined,
    hostname: model.hostname ?? undefined,
    vendor: model.vendor ?? undefined,
    isOnline: model.isOnline,
    lastSeen: new Date(model.lastSeen),
    assetTag: model.assetTag ?? undefined,
    technicalSheetUrl: model.technicalSheetUrl ?? undefined,
  };
}

export class DeviceRepository implements IDeviceRepository {
  private get collection() {
    return database.get<DeviceModel>('devices');
  }

  async save(device: Device): Promise<void> {
    await database.write(async () => {
      const existing = await this.collection
        .query(Q.where('ip', device.ip))
        .fetch();

      if (existing.length > 0) {
        await existing[0].update(record => {
          record.hostname = device.hostname ?? null;
          record.mac = device.mac ?? null;
          record.vendor = device.vendor ?? null;
          record.isOnline = device.isOnline;
          record.lastSeen = device.lastSeen.getTime();
          record.assetTag = device.assetTag ?? null;
          record.technicalSheetUrl = device.technicalSheetUrl ?? null;
        });
      } else {
        await this.collection.create(record => {
          record._raw.id = device.id;
          record.ip = device.ip;
          record.hostname = device.hostname ?? null;
          record.mac = device.mac ?? null;
          record.vendor = device.vendor ?? null;
          record.isOnline = device.isOnline;
          record.lastSeen = device.lastSeen.getTime();
          record.assetTag = device.assetTag ?? null;
          record.technicalSheetUrl = device.technicalSheetUrl ?? null;
        });
      }
    });
  }

  async saveMany(devices: Device[]): Promise<void> {
    await database.write(async () => {
      await database.batch(
        ...devices.map(device =>
          this.collection.prepareCreate(record => {
            record._raw.id = device.id;
            record.ip = device.ip;
            record.hostname = device.hostname ?? null;
            record.mac = device.mac ?? null;
            record.isOnline = device.isOnline;
            record.lastSeen = device.lastSeen.getTime();
          }),
        ),
      );
    });
  }

  async findById(id: string): Promise<Device | null> {
    try {
      const model = await this.collection.find(id);
      return toEntity(model);
    } catch {
      return null;
    }
  }

  async findByIp(ip: string): Promise<Device | null> {
    const results = await this.collection.query(Q.where('ip', ip)).fetch();
    return results.length > 0 ? toEntity(results[0]) : null;
  }

  async findAll(): Promise<Device[]> {
    const models = await this.collection.query().fetch();
    return models.map(toEntity);
  }

  async delete(id: string): Promise<void> {
    await database.write(async () => {
      const model = await this.collection.find(id);
      await model.destroyPermanently();
    });
  }
}
