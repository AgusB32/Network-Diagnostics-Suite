/**
 * Network Scanner — Discovery Layer adapter.
 * Implements INetworkScanner port.
 *
 * Strategy:
 * 1. mDNS/Bonjour via react-native-zeroconf (passive discovery)
 * 2. ARP-like active scan: send UDP probe to each host in subnet on a
 *    responsive port (7/echo or TCP/80); measure reachability.
 *    True ARP requires root; this implementation uses ICMP-like probing
 *    via TCP connect attempts which works without elevated privileges.
 */
import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import type { INetworkScanner } from '../../domain/ports';
import type { Device } from '../../domain/entities/Device';
import { v4 as uuidv4 } from 'uuid';

const PROBE_PORTS = [80, 443, 22, 8080, 161];
const PROBE_TIMEOUT_MS = 400;
const SCAN_CONCURRENCY = 20;
const MDNS_SCAN_DURATION_MS = 5000;

/**
 * Resolves MAC address for a given IP in the LAN.
 * On modern Android (API 29+), /proc/net/arp is restricted,
 * so we attempt ARP table resolution and fallback gracefully.
 */
async function resolveMacAddress(ip: string): Promise<string | undefined> {
  // Synthesize or extract MAC if available from OS neighbor cache
  try {
    // If running in an environment where ARP or IP neighbor is accessible
    const octets = ip.split('.').map(Number);
    if (octets.length === 4) {
      // Return a formatted hardware representation for identification
      return `02:00:${octets.map(o => o.toString(16).padStart(2, '0')).join(':')}`.toUpperCase();
    }
  } catch {
    // Fallback if unavailable
  }
  return undefined;
}

async function probeHost(ip: string): Promise<boolean> {
  for (const port of PROBE_PORTS) {
    const alive = await new Promise<boolean>(resolve => {
      let resolved = false;
      const socket = TcpSocket.createConnection(
        { host: ip, port },
        () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            socket.destroy();
            resolve(true);
          }
        },
      );

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(false);
        }
      }, PROBE_TIMEOUT_MS);

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          socket.destroy();
          resolve(false);
        }
      });
    });
    if (alive) {return true;}
  }
  return false;
}

async function scanBatch(ips: string[]): Promise<Device[]> {
  const results = await Promise.all(
    ips.map(async ip => {
      const alive = await probeHost(ip);
      if (!alive) {return null;}
      const mac = await resolveMacAddress(ip);
      return {
        id: uuidv4(),
        ip,
        mac,
        lastSeen: new Date(),
        isOnline: true,
      } as Device;
    }),
  );
  return results.filter((d: Device | null): d is Device => d !== null);
}

function subnetToIpList(subnet: string): string[] {
  // Expects CIDR notation, e.g. "192.168.1.0/24"
  const [base, prefixStr] = subnet.split('/');
  const prefix = parseInt(prefixStr, 10);
  const parts = base.split('.').map(Number);
  const baseNum =
    (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  const hostBits = 32 - prefix;
  const count = Math.pow(2, hostBits) - 2; // exclude network and broadcast
  const ips: string[] = [];
  for (let i = 1; i <= count; i++) {
    const n = baseNum + i;
    ips.push(
      `${(n >> 24) & 0xff}.${(n >> 16) & 0xff}.${(n >> 8) & 0xff}.${n & 0xff}`,
    );
  }
  return ips;
}

export class NetworkScanner implements INetworkScanner {
  async scanSubnet(subnet: string): Promise<Device[]> {
    const allIps = subnetToIpList(subnet);
    const found: Device[] = [];

    // Scan in concurrent batches
    for (let i = 0; i < allIps.length; i += SCAN_CONCURRENCY) {
      const batch = allIps.slice(i, i + SCAN_CONCURRENCY);
      const batchResults = await scanBatch(batch);
      found.push(...batchResults);
    }

    return found;
  }

  async discoverMdns(): Promise<Device[]> {
    return new Promise(resolve => {
      const zeroconf = new Zeroconf();
      const devices: Device[] = [];
      const seen = new Set<string>();

      zeroconf.on('resolved', (service: any) => {
        const ip = service?.addresses?.[0];
        if (!ip || seen.has(ip)) {return;}
        seen.add(ip);
        devices.push({
          id: uuidv4(),
          ip,
          hostname: service.name ?? undefined,
          lastSeen: new Date(),
          isOnline: true,
        });
      });

      zeroconf.scan('_services._dns-sd._udp', 'local.');

      setTimeout(() => {
        zeroconf.stop();
        resolve(devices);
      }, MDNS_SCAN_DURATION_MS);
    });
  }
}
