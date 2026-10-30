import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, json } from '@nozbe/watermelondb/decorators';

export class DeviceModel extends Model {
  static table = 'devices';

  @field('ip') ip: string;
  @field('mac') mac: string | null;
  @field('hostname') hostname: string | null;
  @field('vendor') vendor: string | null;
  @field('is_online') isOnline: boolean;
  @field('last_seen') lastSeen: number;
  @field('asset_tag') assetTag: string | null;
  @field('technical_sheet_url') technicalSheetUrl: string | null;
}

export class DiagnosticSnapshotModel extends Model {
  static table = 'diagnostic_snapshots';

  @field('device_id') deviceId: string;
  @field('snmp_data_json') snmpDataJson: string | null;
  @field('ssh_output_json') sshOutputJson: string | null;
  @field('captured_at') capturedAt: number;
}

export class InstallationReportModel extends Model {
  static table = 'installation_reports';

  @field('site_name') siteName: string;
  @field('technician_name') technicianName: string;
  @field('notes') notes: string;
  @field('device_id') deviceId: string | null;
  @field('device_ip') deviceIp: string | null;
  @field('photos_json') photosJson: string;
  @field('location_json') locationJson: string | null;
  @field('sync_status') syncState: string;
  @field('pdf_path') pdfPath: string | null;
  @field('created_at') createdAt: number;
}

export class OutboxEntryModel extends Model {
  static table = 'outbox_entries';

  @field('type') type: string;
  @field('payload_json') payloadJson: string;
  @field('attempts') attempts: number;
  @field('last_attempt_at') lastAttemptAt: number | null;
  @field('status') status: string;
  @field('error_message') errorMessage: string | null;
  @field('created_at') createdAt: number;
}
