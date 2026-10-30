/**
 * Outbox repository — implements IOutboxRepository.
 * Core of the Outbox Pattern for offline-first sync.
 */
import { Q } from '@nozbe/watermelondb';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../database/database';
import { OutboxEntryModel } from '../database/models';
import type { IOutboxRepository } from '../../domain/repositories';
import type { OutboxEntry } from '../../domain/entities/InstallationReport';

function toEntity(model: OutboxEntryModel): OutboxEntry {
  return {
    id: model.id,
    type: model.type as OutboxEntry['type'],
    payload: JSON.parse(model.payloadJson),
    attempts: model.attempts,
    lastAttemptAt: model.lastAttemptAt ? new Date(model.lastAttemptAt) : undefined,
    createdAt: new Date(model.createdAt),
    status: model.status as OutboxEntry['status'],
    errorMessage: model.errorMessage ?? undefined,
  };
}

export class OutboxRepository implements IOutboxRepository {
  private get collection() {
    return database.get<OutboxEntryModel>('outbox_entries');
  }

  async enqueue(entry: Omit<OutboxEntry, 'id' | 'createdAt' | 'attempts'>): Promise<OutboxEntry> {
    const id = uuidv4();
    const now = Date.now();

    await database.write(async () => {
      await this.collection.create(record => {
        record._raw.id = id;
        record.type = entry.type;
        record.payloadJson = JSON.stringify(entry.payload);
        record.attempts = 0;
        record.status = 'pending';
        record.createdAt = now;
      });
    });

    return {
      id,
      type: entry.type,
      payload: entry.payload,
      attempts: 0,
      status: 'pending',
      createdAt: new Date(now),
    };
  }

  async findPending(): Promise<OutboxEntry[]> {
    const models = await this.collection
      .query(Q.where('status', Q.oneOf(['pending', 'error'])))
      .fetch();
    return models.map(toEntity);
  }

  async markSuccess(id: string): Promise<void> {
    await database.write(async () => {
      const model = await this.collection.find(id);
      await model.update(record => {
        record.status = 'synced';
        record.lastAttemptAt = Date.now();
      });
    });
  }

  async markFailed(id: string, error: string): Promise<void> {
    await database.write(async () => {
      const model = await this.collection.find(id);
      await model.update(record => {
        record.status = 'error';
        record.errorMessage = error;
        record.lastAttemptAt = Date.now();
      });
    });
  }

  async incrementAttempt(id: string): Promise<void> {
    await database.write(async () => {
      const model = await this.collection.find(id);
      await model.update(record => {
        record.attempts = record.attempts + 1;
        record.lastAttemptAt = Date.now();
      });
    });
  }

  async deleteProcessed(): Promise<void> {
    await database.write(async () => {
      const processed = await this.collection
        .query(Q.where('status', 'synced'))
        .fetch();
      await database.batch(
        ...processed.map(m => m.prepareDestroyPermanently()),
      );
    });
  }
}
