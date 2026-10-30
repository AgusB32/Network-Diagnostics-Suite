/**
 * Use Case: Query SNMP for system info and interface stats (RF-02).
 */
import type { ISnmpClient } from '../../domain/ports';
import type { IDeviceRepository } from '../../domain/repositories';
import type { SnmpData } from '../../domain/entities/Device';

export interface SnmpQueryInput {
  deviceId: string;
  host: string;
  community: string;
}

export class QuerySnmpUseCase {
  constructor(
    private readonly snmpClient: ISnmpClient,
    private readonly deviceRepo: IDeviceRepository,
  ) {}

  async execute(input: SnmpQueryInput): Promise<SnmpData> {
    const snmpData = await this.snmpClient.getSystemInfo(input.host, input.community);

    // Update device hostname from SNMP if we got one
    if (snmpData.sysName) {
      const device = await this.deviceRepo.findById(input.deviceId);
      if (device) {
        await this.deviceRepo.save({
          ...device,
          hostname: snmpData.sysName,
        });
      }
    }

    return snmpData;
  }
}
