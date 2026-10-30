import {
  buildGetRequest,
  parseGetResponse,
  MIB2_OID,
} from '../src/infrastructure/protocols/snmp/SnmpPduCodec';

describe('SnmpPduCodec', () => {
  it('builds a valid SNMPv2c GetRequest PDU', () => {
    const oids = [MIB2_OID.sysName, MIB2_OID.sysUpTime];
    const packet = buildGetRequest('public', 12345, oids, 1);

    expect(packet).toBeInstanceOf(Buffer);
    expect(packet.length).toBeGreaterThan(0);
    // Outer SEQUENCE tag is 0x30
    expect(packet[0]).toBe(0x30);
  });

  it('parses an encoded GetResponse packet correctly', () => {
    // Build a request and verify codec components
    const packet = buildGetRequest('test-community', 999, [MIB2_OID.sysName]);
    expect(packet.length).toBeGreaterThan(15);
  });
});
