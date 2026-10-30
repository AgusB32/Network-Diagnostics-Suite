/**
 * Use Case: Create installation report with photos, GPS, and generate PDF (RF-05, RF-06).
 * Also enqueues report to outbox for deferred sync (RF-07).
 */
import { v4 as uuidv4 } from 'uuid';
import type { IGeolocationService, IPdfGenerator } from '../../domain/ports';
import type { IReportRepository, IOutboxRepository } from '../../domain/repositories';
import type { InstallationReport, Photo } from '../../domain/entities/InstallationReport';
import { buildReportHtml } from '../templates/ReportHtmlTemplate';

export interface CreateReportInput {
  siteName: string;
  technicianName: string;
  notes: string;
  deviceId?: string;
  deviceIp?: string;
  photoUris: string[];
}

export class CreateInstallationReportUseCase {
  constructor(
    private readonly reportRepo: IReportRepository,
    private readonly outboxRepo: IOutboxRepository,
    private readonly geolocation: IGeolocationService,
    private readonly pdfGenerator: IPdfGenerator,
  ) {}

  async execute(input: CreateReportInput): Promise<InstallationReport> {
    // 1. Capture GPS location
    let location = undefined;
    try {
      location = await this.geolocation.getCurrentLocation();
    } catch {
      // Location is optional — proceed without it
      console.warn('[CreateReport] Could not get GPS location');
    }

    // 2. Build photo entries with timestamps
    const photos: Photo[] = input.photoUris.map(uri => ({
      id: uuidv4(),
      uri,
      takenAt: new Date(),
      location,
    }));

    // 3. Create the report entity
    const report: InstallationReport = {
      id: uuidv4(),
      siteName: input.siteName,
      technicianName: input.technicianName,
      notes: input.notes,
      deviceId: input.deviceId,
      deviceIp: input.deviceIp,
      photos,
      location,
      createdAt: new Date(),
      syncStatus: 'pending',
    };

    // 4. Generate PDF
    try {
      const html = buildReportHtml(report);
      const pdfPath = await this.pdfGenerator.generate(
        html,
        `report_${report.id}`,
      );
      report.pdfPath = pdfPath;
    } catch (err) {
      console.warn('[CreateReport] PDF generation failed:', err);
    }

    // 5. Persist locally
    await this.reportRepo.save(report);

    // 6. Enqueue to outbox for deferred backend sync
    await this.outboxRepo.enqueue({
      type: 'report',
      payload: report,
      status: 'pending',
    });

    return report;
  }
}
