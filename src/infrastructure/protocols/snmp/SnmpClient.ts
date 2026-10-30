/**
 * SNMP Client adapter — implements ISnmpClient port.
 * Sends GetRequest PDUs over UDP/161 and decodes GetResponse.
 * Uses react-native-udp for raw socket access.
 *
 * Security note: SNMPv1/v2c uses community strings in plaintext.
 * Do NOT use on untrusted networks. This implementation is intentional
 * for diagnostic tooling in controlled LAN environments.
 */
import UdpSocket from 'react-native-udp';
import type { ISnmpClient } from '../../../domain/ports';
import type { SnmpData, NetworkInterface } from '../../../domain/entities/Device';
import {
  buildGetRequest,
  parseGetResponse,
  MIB2_OID,
} from './SnmpPduCodec';

const SNMP_PORT = 161;
const TIMEOUT_MS = 5000;
const MAX_REQUEST_ID = 0x7fffffff;

let requestIdCounter = 1;
function nextRequestId(): number {
  requestIdCounter = (requestIdCounter % MAX_REQUEST_ID) + 1;
  return requestIdCounter;
}

const SYSTEM_OIDS = [
  MIB2_OID.sysName,
  MIB2_OID.sysDescr,
  MIB2_OID.sysUpTime,
  MIB2_OID.sysContact,
  MIB2_OID.sysLocation,
  MIB2_OID.ifNumber,
  `${MIB2_OID.ifDescr}.1`,
  `${MIB2_OID.ifOperStatus}.1`,
  `${MIB2_OID.ifInOctets}.1`,
  `${MIB2_OID.ifOutOctets}.1`,
  `${MIB2_OID.ifDescr}.2`,
  `${MIB2_OID.ifOperStatus}.2`,
  `${MIB2_OID.ifInOctets}.2`,
  `${MIB2_OID.ifOutOctets}.2`,
];

async function sendUdpQuery(
  host: string,
  packet: Buffer | Uint8Array,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const socket: any = UdpSocket.createSocket({ type: 'udp4', debug: false });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`SNMP timeout for host ${host}`));
    }, TIMEOUT_MS);

    socket.on('message', (msg: Buffer) => {
      clearTimeout(timer);
      socket.close();
      resolve(msg);
    });

    socket.on('error', (err: Error) => {
      clearTimeout(timer);
      socket.close();
      reject(err);
    });

    socket.bind(0, () => {
      socket.send(packet, 0, packet.length, SNMP_PORT, host, (err?: Error | null) => {
        if (err) {
          clearTimeout(timer);
          socket.close();
          reject(err);
        }
      });
    });
  });
}

function parseIfOperStatus(value: number): NetworkInterface['operStatus'] {
  const map: Record<number, NetworkInterface['operStatus']> = {
    1: 'up', 2: 'down', 3: 'testing', 4: 'unknown',
    5: 'dormant', 6: 'notPresent', 7: 'lowerLayerDown',
  };
  return map[value] ?? 'unknown';
}

export class SnmpClient implements ISnmpClient {
  async query(host: string, community: string, oids: string[]): Promise<SnmpData> {
    const requestId = nextRequestId();
    const packet = buildGetRequest(community, requestId, oids, 1);
    const raw = await sendUdpQuery(host, packet);
    const response = parseGetResponse(raw);

    if (response.errorStatus !== 0) {
      throw new Error(
        `SNMP error-status ${response.errorStatus} at index ${response.errorIndex}`,
      );
    }

    const result: SnmpData = { queriedAt: new Date() };
    const ifaceMap = new Map<number, Partial<NetworkInterface>>();

    for (const vb of response.varBinds) {
      if (vb.oid === MIB2_OID.sysName) {result.sysName = String(vb.value ?? '');}
      if (vb.oid === MIB2_OID.sysDescr) {result.sysDescr = String(vb.value ?? '');}
      if (vb.oid === MIB2_OID.sysUpTime) {result.sysUptime = Number(vb.value ?? 0);}
      if (vb.oid === MIB2_OID.sysLocation) {result.sysLocation = String(vb.value ?? '');}

      // Interface metrics (RF-02)
      if (vb.oid.startsWith(MIB2_OID.ifDescr)) {
        const idx = parseInt(vb.oid.split('.').pop() ?? '1', 10);
        const iface = ifaceMap.get(idx) ?? { index: idx, adminStatus: 'up', operStatus: 'up', type: 6 };
        iface.name = String(vb.value ?? `eth${idx - 1}`);
        ifaceMap.set(idx, iface);
      } else if (vb.oid.startsWith(MIB2_OID.ifOperStatus)) {
        const idx = parseInt(vb.oid.split('.').pop() ?? '1', 10);
        const iface = ifaceMap.get(idx) ?? { index: idx, adminStatus: 'up', operStatus: 'up', type: 6 };
        iface.operStatus = parseIfOperStatus(Number(vb.value ?? 1));
        ifaceMap.set(idx, iface);
      } else if (vb.oid.startsWith(MIB2_OID.ifInOctets)) {
        const idx = parseInt(vb.oid.split('.').pop() ?? '1', 10);
        const iface = ifaceMap.get(idx) ?? { index: idx, adminStatus: 'up', operStatus: 'up', type: 6 };
        iface.inOctets = Number(vb.value ?? 0);
        ifaceMap.set(idx, iface);
      } else if (vb.oid.startsWith(MIB2_OID.ifOutOctets)) {
        const idx = parseInt(vb.oid.split('.').pop() ?? '1', 10);
        const iface = ifaceMap.get(idx) ?? { index: idx, adminStatus: 'up', operStatus: 'up', type: 6 };
        iface.outOctets = Number(vb.value ?? 0);
        ifaceMap.set(idx, iface);
      }
    }

    if (ifaceMap.size > 0) {
      result.interfaces = Array.from(ifaceMap.values()).map(i => ({
        index: i.index ?? 1,
        name: i.name ?? `eth0`,
        type: i.type ?? 6,
        adminStatus: i.adminStatus ?? 'up',
        operStatus: i.operStatus ?? 'up',
        inOctets: i.inOctets,
        outOctets: i.outOctets,
      }));
    }

    return result;
  }

  async getSystemInfo(host: string, community: string): Promise<SnmpData> {
    return this.query(host, community, SYSTEM_OIDS);
  }
}
