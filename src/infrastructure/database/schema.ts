/**
 * WatermelonDB schema definition.
 * All tables need explicit migration tracking; this is schema version 1.
 */
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'devices',
      columns: [
        { name: 'ip', type: 'string' },
        { name: 'mac', type: 'string', isOptional: true },
        { name: 'hostname', type: 'string', isOptional: true },
        { name: 'vendor', type: 'string', isOptional: true },
        { name: 'is_online', type: 'boolean' },
        { name: 'last_seen', type: 'number' },
        { name: 'asset_tag', type: 'string', isOptional: true },
        { name: 'technical_sheet_url', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'diagnostic_snapshots',
      columns: [
        { name: 'device_id', type: 'string', isIndexed: true },
        { name: 'snmp_data_json', type: 'string', isOptional: true },
        { name: 'ssh_output_json', type: 'string', isOptional: true },
        { name: 'captured_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'installation_reports',
      columns: [
        { name: 'site_name', type: 'string' },
        { name: 'technician_name', type: 'string' },
        { name: 'notes', type: 'string' },
        { name: 'device_id', type: 'string', isOptional: true },
        { name: 'device_ip', type: 'string', isOptional: true },
        { name: 'photos_json', type: 'string' },
        { name: 'location_json', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string' },
        { name: 'pdf_path', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'outbox_entries',
      columns: [
        { name: 'type', type: 'string' },
        { name: 'payload_json', type: 'string' },
        { name: 'attempts', type: 'number' },
        { name: 'last_attempt_at', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
