/**
 * Use Case: Scan the local network and persist discovered devices (RF-01).
 * SRP: only orchestrates discovery + persistence.
 */
import type { INetworkScanner } from '../../domain/ports';
import type { IDeviceRepository } from '../../domain/repositories';
import type { Device } from '../../domain/entities/Device';

export interface ScanNetworkResult {
  devices: Device[];
  subnetScanned: string;
  mdnsDevices: number;
  arpDevices: number;
  durationMs: number;
}

export class ScanNetworkUseCase {
  constructor(
    private readonly scanner: INetworkScanner,
    private readonly deviceRepo: IDeviceRepository,
  ) {}

  async execute(subnet: string): Promise<ScanNetworkResult> {
    const start = Date.now();

    const [mdnsDevices, subnetDevices] = await Promise.all([
      this.scanner.discoverMdns(),
      this.scanner.scanSubnet(subnet),
    ]);

    // Merge by IP, mDNS enriches ARP results
    const byIp = new Map<string, Device>();
    for (const d of subnetDevices) { byIp.set(d.ip, d); }
    for (const d of mdnsDevices) {
      const existing = byIp.get(d.ip);
      if (existing) {
        byIp.set(d.ip, { ...existing, hostname: d.hostname ?? existing.hostname });
      } else {
        byIp.set(d.ip, d);
      }
    }

    const merged = Array.from(byIp.values());

    // Persist all discovered devices (upsert)
    for (const device of merged) {
      await this.deviceRepo.save(device);
    }

    return {
      devices: merged,
      subnetScanned: subnet,
      mdnsDevices: mdnsDevices.length,
      arpDevices: subnetDevices.length,
      durationMs: Date.now() - start,
    };
  }
}
