/**
 * HTML template for PDF installation reports (RF-06).
 * Generates a professional A4-formatted report with:
 * - Header with app branding
 * - Site and technician metadata
 * - GPS coordinates with timestamp
 * - Technical notes
 * - Embedded photos (base64 or file:// URI)
 */
import { format } from 'date-fns';
import type { InstallationReport } from '../../domain/entities/InstallationReport';

export function buildReportHtml(report: InstallationReport): string {
  const dateStr = format(report.createdAt, 'dd/MM/yyyy HH:mm');
  const coords = report.location
    ? `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`
    : 'Not available';
  const accuracy = report.location?.accuracy
    ? `±${report.location.accuracy.toFixed(0)}m`
    : '';

  const photosHtml = report.photos
    .map(
      photo => `
      <div class="photo-item">
        <img src="${photo.uri}" alt="Site photo" />
        ${photo.caption ? `<p class="photo-caption">${photo.caption}</p>` : ''}
        <p class="photo-meta">${format(photo.takenAt, 'dd/MM/yyyy HH:mm')}</p>
      </div>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; }
    .header { background: linear-gradient(135deg, #0f3460 0%, #16213e 100%); color: white; padding: 24px 32px; }
    .header h1 { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .header p { font-size: 11px; opacity: 0.8; margin-top: 4px; }
    .badge { background: #e94560; display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; margin-top: 8px; }
    .content { padding: 32px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 13px; font-weight: 700; color: #0f3460; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #e94560; padding-bottom: 6px; margin-bottom: 14px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { background: #f8f9ff; border-radius: 8px; padding: 12px; }
    .field-label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .field-value { font-size: 13px; font-weight: 600; color: #1a1a2e; }
    .notes-box { background: #f8f9ff; border-left: 4px solid #0f3460; padding: 16px; border-radius: 0 8px 8px 0; white-space: pre-wrap; }
    .photos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .photo-item { border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
    .photo-item img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .photo-caption { padding: 8px; font-size: 11px; font-weight: 600; }
    .photo-meta { padding: 4px 8px 8px; font-size: 10px; color: #888; }
    .footer { background: #f0f0f0; padding: 16px 32px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #ddd; }
    .status-badge { display: inline-block; background: #e94560; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Network Diagnostics Suite</h1>
    <p>Installation & Site Report</p>
    <div class="badge">FIELD REPORT</div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Report Information</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Report ID</div>
          <div class="field-value">${report.id.slice(0, 8).toUpperCase()}</div>
        </div>
        <div class="field">
          <div class="field-label">Date &amp; Time</div>
          <div class="field-value">${dateStr}</div>
        </div>
        <div class="field">
          <div class="field-label">Technician</div>
          <div class="field-value">${report.technicianName}</div>
        </div>
        <div class="field">
          <div class="field-label">Sync Status</div>
          <div class="field-value"><span class="status-badge">${report.syncStatus.toUpperCase()}</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Site Details</div>
      <div class="grid">
        <div class="field">
          <div class="field-label">Site Name</div>
          <div class="field-value">${report.siteName}</div>
        </div>
        ${report.deviceIp ? `
        <div class="field">
          <div class="field-label">Device IP</div>
          <div class="field-value">${report.deviceIp}</div>
        </div>` : ''}
        <div class="field">
          <div class="field-label">GPS Coordinates</div>
          <div class="field-value">${coords} ${accuracy}</div>
        </div>
        ${report.location ? `
        <div class="field">
          <div class="field-label">Location Timestamp</div>
          <div class="field-value">${format(report.location.timestamp, 'dd/MM/yyyy HH:mm:ss')}</div>
        </div>` : ''}
      </div>
    </div>

    ${report.notes ? `
    <div class="section">
      <div class="section-title">Technical Notes</div>
      <div class="notes-box">${report.notes}</div>
    </div>` : ''}

    ${report.photos.length > 0 ? `
    <div class="section">
      <div class="section-title">Photo Evidence (${report.photos.length})</div>
      <div class="photos-grid">
        ${photosHtml}
      </div>
    </div>` : ''}
  </div>

  <div class="footer">
    Generated by Network Diagnostics Suite &bull; Report ${report.id} &bull; ${dateStr}
  </div>
</body>
</html>`;
}
