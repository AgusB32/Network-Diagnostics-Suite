/**
 * SNMP BER/ASN.1 PDU encoder/decoder — subset of SNMPv1/v2c
 * Implements GetRequest/GetResponse over UDP port 161.
 *
 * Scope: MIB-II system group (1.3.6.1.2.1.1.x) + IF-MIB (1.3.6.1.2.1.2.x)
 * Limitations: community-string auth only, no SNMPv3 security.
 * Reference: RFC 1157, RFC 1213.
 */

// ASN.1 / BER type tags
const ASN1_TYPE = {
  INTEGER: 0x02,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
  // SNMP application types
  IP_ADDRESS: 0x40,
  COUNTER32: 0x41,
  GAUGE32: 0x42,
  TIMETICKS: 0x43,
  OPAQUE: 0x44,
  // SNMP PDU types
  GET_REQUEST: 0xa0,
  GET_NEXT_REQUEST: 0xa1,
  GET_RESPONSE: 0xa2,
} as const;

// Well-known OIDs (MIB-II system group)
export const MIB2_OID = {
  sysDescr: '1.3.6.1.2.1.1.1.0',
  sysObjectID: '1.3.6.1.2.1.1.2.0',
  sysUpTime: '1.3.6.1.2.1.1.3.0',
  sysContact: '1.3.6.1.2.1.1.4.0',
  sysName: '1.3.6.1.2.1.1.5.0',
  sysLocation: '1.3.6.1.2.1.1.6.0',
  ifNumber: '1.3.6.1.2.1.2.1.0',
  // IF-MIB table base (requires GetNext walk for instances)
  ifDescr: '1.3.6.1.2.1.2.2.1.2',
  ifOperStatus: '1.3.6.1.2.1.2.2.1.8',
  ifInOctets: '1.3.6.1.2.1.2.2.1.10',
  ifOutOctets: '1.3.6.1.2.1.2.2.1.16',
} as const;

// ─── Encoding ────────────────────────────────────────────────────────────────

function encodeLengthBER(len: number): number[] {
  if (len < 0x80) {return [len];}
  if (len <= 0xff) {return [0x81, len];}
  return [0x82, (len >> 8) & 0xff, len & 0xff];
}

function encodeOid(oidStr: string): number[] {
  const parts = oidStr.split('.').map(Number);
  const encoded: number[] = [];
  // First two components compressed: first * 40 + second
  encoded.push(parts[0] * 40 + parts[1]);
  for (let i = 2; i < parts.length; i++) {
    let value = parts[i];
    const bytes: number[] = [];
    bytes.push(value & 0x7f);
    value >>= 7;
    while (value > 0) {
      bytes.unshift((value & 0x7f) | 0x80);
      value >>= 7;
    }
    encoded.push(...bytes);
  }
  return [ASN1_TYPE.OBJECT_IDENTIFIER, ...encodeLengthBER(encoded.length), ...encoded];
}

function encodeInteger(value: number): number[] {
  // Minimal encoding, signed
  const bytes: number[] = [];
  let v = value;
  do {
    bytes.unshift(v & 0xff);
    v >>= 8;
  } while (v !== 0 && v !== -1);
  // Sign-extend if needed
  if ((bytes[0] & 0x80) !== 0 && value >= 0) {bytes.unshift(0x00);}
  return [ASN1_TYPE.INTEGER, ...encodeLengthBER(bytes.length), ...bytes];
}

function encodeOctetString(str: string): number[] {
  const bytes = Array.from(str).map(c => c.charCodeAt(0));
  return [ASN1_TYPE.OCTET_STRING, ...encodeLengthBER(bytes.length), ...bytes];
}

function encodeTlv(tag: number, value: number[]): number[] {
  return [tag, ...encodeLengthBER(value.length), ...value];
}

/**
 * Build a SNMP v1/v2c GetRequest PDU.
 * Returns a Buffer ready to send over UDP.
 */
export function buildGetRequest(
  community: string,
  requestId: number,
  oids: string[],
  version: 0 | 1 = 1, // 0=v1, 1=v2c
): Buffer {
  // VarBindList: each variable binding is (OID, NULL)
  const varBinds = oids.flatMap(oid => {
    const oidEnc = encodeOid(oid);
    const nullVal = [ASN1_TYPE.NULL, 0x00];
    return encodeTlv(ASN1_TYPE.SEQUENCE, [...oidEnc, ...nullVal]);
  });
  const varBindList = encodeTlv(ASN1_TYPE.SEQUENCE, varBinds);

  // PDU = requestId + error-status(0) + error-index(0) + varBindList
  const pduBody = [
    ...encodeInteger(requestId),
    ...encodeInteger(0), // error-status: noError
    ...encodeInteger(0), // error-index
    ...varBindList,
  ];
  const pdu = encodeTlv(ASN1_TYPE.GET_REQUEST, pduBody);

  // SNMP message = version + community + PDU
  const message = [
    ...encodeInteger(version),
    ...encodeOctetString(community),
    ...pdu,
  ];
  const packet = encodeTlv(ASN1_TYPE.SEQUENCE, message);
  return Buffer.from(packet);
}

// ─── Decoding ────────────────────────────────────────────────────────────────

interface DecodedTlv {
  tag: number;
  length: number;
  value: number[];
  bytesConsumed: number;
}

function decodeTlv(data: number[], offset: number): DecodedTlv {
  const tag = data[offset];
  let length = data[offset + 1];
  let headerLen = 2;

  if (length & 0x80) {
    const numBytes = length & 0x7f;
    length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | data[offset + 2 + i];
    }
    headerLen = 2 + numBytes;
  }

  const value = data.slice(offset + headerLen, offset + headerLen + length);
  return { tag, length, value, bytesConsumed: headerLen + length };
}

function decodeInteger(bytes: number[]): number {
  let result = 0;
  const signed = (bytes[0] & 0x80) !== 0;
  for (const byte of bytes) {
    result = (result << 8) | byte;
  }
  if (signed && bytes.length < 4) {
    result = result - (1 << (bytes.length * 8));
  }
  return result;
}

function decodeOctetString(bytes: number[]): string {
  return bytes.map(b => String.fromCharCode(b)).join('');
}

function decodeOid(bytes: number[]): string {
  const parts: number[] = [];
  // First byte encodes first two components
  parts.push(Math.floor(bytes[0] / 40));
  parts.push(bytes[0] % 40);

  let i = 1;
  while (i < bytes.length) {
    let value = 0;
    while (i < bytes.length) {
      const b = bytes[i++];
      value = (value << 7) | (b & 0x7f);
      if ((b & 0x80) === 0) {break;}
    }
    parts.push(value);
  }
  return parts.join('.');
}

export interface VarBind {
  oid: string;
  type: number;
  value: string | number | null;
  rawBytes?: number[];
}

function decodeVarBind(bytes: number[]): VarBind {
  let offset = 0;
  const oidTlv = decodeTlv(bytes, offset);
  offset += oidTlv.bytesConsumed;
  const oid = decodeOid(oidTlv.value);

  const valTlv = decodeTlv(bytes, offset);
  let value: string | number | null = null;

  switch (valTlv.tag) {
    case ASN1_TYPE.INTEGER:
      value = decodeInteger(valTlv.value);
      break;
    case ASN1_TYPE.OCTET_STRING:
      value = decodeOctetString(valTlv.value);
      break;
    case ASN1_TYPE.TIMETICKS:
    case ASN1_TYPE.COUNTER32:
    case ASN1_TYPE.GAUGE32:
      value = decodeInteger(valTlv.value);
      break;
    case ASN1_TYPE.OBJECT_IDENTIFIER:
      value = decodeOid(valTlv.value);
      break;
    case ASN1_TYPE.IP_ADDRESS:
      value = valTlv.value.join('.');
      break;
    case ASN1_TYPE.NULL:
      value = null;
      break;
    default:
      value = null;
  }

  return { oid, type: valTlv.tag, value, rawBytes: valTlv.value };
}

export interface SnmpResponse {
  version: number;
  community: string;
  requestId: number;
  errorStatus: number;
  errorIndex: number;
  varBinds: VarBind[];
}

/**
 * Parse a raw SNMP GetResponse PDU from a UDP datagram.
 */
export function parseGetResponse(data: Buffer | Uint8Array): SnmpResponse {
  const bytes: number[] = Array.from(data as any);
  let offset = 0;

  // Outer SEQUENCE
  const outer = decodeTlv(bytes, offset);
  if (outer.tag !== ASN1_TYPE.SEQUENCE) {
    throw new Error(`Expected SEQUENCE (0x30), got 0x${outer.tag.toString(16)}`);
  }
  offset = 0;
  const inner = outer.value;
  let innerOffset = 0;

  // Version
  const versionTlv = decodeTlv(inner, innerOffset);
  innerOffset += versionTlv.bytesConsumed;
  const version = decodeInteger(versionTlv.value);

  // Community
  const communityTlv = decodeTlv(inner, innerOffset);
  innerOffset += communityTlv.bytesConsumed;
  const community = decodeOctetString(communityTlv.value);

  // PDU (GetResponse)
  const pduTlv = decodeTlv(inner, innerOffset);
  if (pduTlv.tag !== ASN1_TYPE.GET_RESPONSE) {
    throw new Error(`Expected GET_RESPONSE PDU, got 0x${pduTlv.tag.toString(16)}`);
  }
  const pdu = pduTlv.value;
  let pduOffset = 0;

  const reqIdTlv = decodeTlv(pdu, pduOffset);
  pduOffset += reqIdTlv.bytesConsumed;
  const requestId = decodeInteger(reqIdTlv.value);

  const errStatusTlv = decodeTlv(pdu, pduOffset);
  pduOffset += errStatusTlv.bytesConsumed;
  const errorStatus = decodeInteger(errStatusTlv.value);

  const errIndexTlv = decodeTlv(pdu, pduOffset);
  pduOffset += errIndexTlv.bytesConsumed;
  const errorIndex = decodeInteger(errIndexTlv.value);

  // VarBindList
  const varBindListTlv = decodeTlv(pdu, pduOffset);
  const vbList = varBindListTlv.value;
  const varBinds: VarBind[] = [];
  let vbOffset = 0;

  while (vbOffset < vbList.length) {
    const vbSeq = decodeTlv(vbList, vbOffset);
    vbOffset += vbSeq.bytesConsumed;
    varBinds.push(decodeVarBind(vbSeq.value));
  }

  return { version, community, requestId, errorStatus, errorIndex, varBinds };
}
