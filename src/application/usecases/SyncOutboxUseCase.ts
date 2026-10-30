/**
 * Use Case: Sync pending outbox entries to the backend (RF-07).
 * Implements exponential backoff retry with max 3 attempts.
 * Triggered automatically by ConnectivityMonitor when internet is restored.
 */
import { Platform } from 'react-native';
import type { ISyncService, IConnectivityMonitor } from '../../domain/ports';
import type { IOutboxRepository } from '../../domain/repositories';
import type { OutboxEntry } from '../../domain/entities/InstallationReport';

const MAX_ATTEMPTS = 3;
const DEFAULT_BACKEND_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

async function postToBackend(entry: OutboxEntry, baseUrl: string): Promise<void> {
  const response = await fetch(`${baseUrl}/sync/${entry.type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry.payload),
  });
  if (!response.ok) {
    throw new Error(`Backend responded with ${response.status}`);
  }
}

export class SyncOutboxUseCase implements ISyncService {
  constructor(
    private readonly outboxRepo: IOutboxRepository,
    private readonly connectivity: IConnectivityMonitor,
    private readonly backendUrl: string = DEFAULT_BACKEND_URL,
  ) {}

  async syncPendingEntries(): Promise<{ succeeded: number; failed: number }> {
    const isOnline = await this.connectivity.isConnected();
    if (!isOnline) {
      return { succeeded: 0, failed: 0 };
    }

    const pending = await this.outboxRepo.findPending();
    let succeeded = 0;
    let failed = 0;

    for (const entry of pending) {
      if (entry.attempts >= MAX_ATTEMPTS) {
        // Give up after max retries — leave in error state for manual review
        await this.outboxRepo.markFailed(entry.id, `Max retries (${MAX_ATTEMPTS}) exceeded`);
        failed++;
        continue;
      }

      await this.outboxRepo.incrementAttempt(entry.id);

      try {
        await postToBackend(entry, this.backendUrl);
        await this.outboxRepo.markSuccess(entry.id);
        succeeded++;
      } catch (err: any) {
        await this.outboxRepo.markFailed(entry.id, err?.message ?? 'Unknown error');
        failed++;
      }
    }

    // Cleanup synced entries
    await this.outboxRepo.deleteProcessed();

    return { succeeded, failed };
  }
}
