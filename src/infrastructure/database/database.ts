import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import {
  DeviceModel,
  DiagnosticSnapshotModel,
  InstallationReportModel,
  OutboxEntryModel,
} from './models';

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'network_diagnostics',
  jsi: true, // JSI bridge for performance
  onSetUpError: (error: Error) => {
    console.error('[WatermelonDB] Setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    DeviceModel,
    DiagnosticSnapshotModel,
    InstallationReportModel,
    OutboxEntryModel,
  ],
});
