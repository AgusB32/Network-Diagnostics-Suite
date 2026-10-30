/**
 * Dependency Injection container — manual DI (no IoC lib needed at this scale).
 * All infrastructure adapters are wired here and injected into use cases.
 * Single place to swap implementations (e.g., mock for tests).
 */

// Infrastructure
import { NetworkScanner } from '../infrastructure/network/NetworkScanner';
import { SnmpClient } from '../infrastructure/protocols/snmp/SnmpClient';
import { SshClientAdapter } from '../infrastructure/protocols/ssh/SshClientAdapter';
import { SecureCredentialStore } from '../infrastructure/security/SecureCredentialStore';
import { GeolocationAdapter } from '../infrastructure/location/GeolocationAdapter';
import { PdfGeneratorAdapter } from '../infrastructure/reporting/PdfGeneratorAdapter';
import { ConnectivityMonitor } from '../infrastructure/sync/ConnectivityMonitor';
import { DeviceRepository } from '../infrastructure/repositories/DeviceRepository';
import { OutboxRepository } from '../infrastructure/repositories/OutboxRepository';
import { ReportRepository } from '../infrastructure/repositories/ReportRepository';

// Use Cases
import { ScanNetworkUseCase } from './usecases/ScanNetworkUseCase';
import { QuerySnmpUseCase } from './usecases/QuerySnmpUseCase';
import { RunSshDiagnosticsUseCase } from './usecases/RunSshDiagnosticsUseCase';
import { CreateInstallationReportUseCase } from './usecases/CreateInstallationReportUseCase';
import { SyncOutboxUseCase } from './usecases/SyncOutboxUseCase';

// ─── Adapters (singletons) ────────────────────────────────────────────────────
const networkScanner = new NetworkScanner();
const snmpClient = new SnmpClient();
const sshClient = new SshClientAdapter();
const credentialStore = new SecureCredentialStore();
const geolocation = new GeolocationAdapter();
const pdfGenerator = new PdfGeneratorAdapter();
const connectivity = new ConnectivityMonitor();
const deviceRepo = new DeviceRepository();
const outboxRepo = new OutboxRepository();
const reportRepo = new ReportRepository();

// ─── Use Cases ────────────────────────────────────────────────────────────────
export const scanNetwork = new ScanNetworkUseCase(networkScanner, deviceRepo);
export const querySnmp = new QuerySnmpUseCase(snmpClient, deviceRepo);
export const runSshDiagnostics = new RunSshDiagnosticsUseCase(sshClient, credentialStore);
export const createReport = new CreateInstallationReportUseCase(
  reportRepo,
  outboxRepo,
  geolocation,
  pdfGenerator,
);
export const syncOutbox = new SyncOutboxUseCase(outboxRepo, connectivity);

// Export adapters for direct use where needed
export { connectivity, credentialStore, deviceRepo, outboxRepo, reportRepo };
