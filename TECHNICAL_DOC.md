# Network Diagnostics Suite — Technical Documentation

## 1. SNMP Subset Implementation

### Protocol Version
SNMPv1 and SNMPv2c GetRequest/GetResponse over UDP port 161.

### BER/ASN.1 Codec (`SnmpPduCodec.ts`)

Implements a minimal subset of BER encoding/decoding:

| Operation | Coverage |
|-----------|----------|
| Encoding  | INTEGER, OCTET_STRING, OBJECT_IDENTIFIER, NULL, SEQUENCE, GET_REQUEST PDU |
| Decoding  | All of the above + TIMETICKS, COUNTER32, GAUGE32, IP_ADDRESS, GET_RESPONSE PDU |
| OID compression | First two arcs, variable-length quantity (VLQ) for subsequent arcs |
| Length encoding | Short form (<128 bytes) + long form (1–2 continuation bytes) |

### Supported MIB-II OIDs

| OID | Name | Description |
|-----|------|-------------|
| 1.3.6.1.2.1.1.1.0 | sysDescr | System description string |
| 1.3.6.1.2.1.1.3.0 | sysUpTime | Uptime in centiseconds |
| 1.3.6.1.2.1.1.4.0 | sysContact | Contact string |
| 1.3.6.1.2.1.1.5.0 | sysName | Hostname |
| 1.3.6.1.2.1.1.6.0 | sysLocation | Physical location |
| 1.3.6.1.2.1.2.1.0 | ifNumber | Number of interfaces |

### Security Limitations (documented per PRD requirement)

> [!WARNING]
> **SNMPv1/v2c transmits community strings in cleartext** over UDP.
> This implementation is intentionally limited to community-string authentication only.
> **Do not use on untrusted networks.** In production, prefer SNMPv3 with authentication (MD5/SHA) and privacy (AES/DES).
> The app displays an explicit warning on the SNMP query screen.

---

## 2. SSH Credential Management

### Storage
Credentials are stored exclusively in the platform's **secure enclave**:
- **iOS**: Keychain Services (via `react-native-keychain` / `setInternetCredentials`)
- **Android**: Android Keystore + EncryptedSharedPreferences

### What is stored
| Field | Where |
|-------|-------|
| Username | Keychain/Keystore (key: `ssh:<ip>`) |
| Password | Keychain/Keystore (key: `ssh:<ip>`) |
| Private key | NOT implemented in v1 — only password auth |

### What is NEVER stored
- Passwords in AsyncStorage, SQLite, WatermelonDB, or any file
- Credentials in Redux/Zustand state that could be serialized to disk
- Credentials in logs or error messages

### OWASP Reference
This design addresses **M9 — Insecure Data Storage** from the OWASP Mobile Application Security Verification Standard.

---

## 3. Offline Queue Design (Outbox Pattern)

### Architecture

```
[User Action] → [Use Case] → [Local DB persist] → [Outbox enqueue]
                                                          ↓
                                              [ConnectivityMonitor]
                                                          ↓ (online)
                                              [SyncOutboxUseCase]
                                                          ↓
                                              [Backend POST /sync/...]
```

### State Machine

```
         ┌─────────┐
         │ pending │ ←────────────────────────────────┐
         └────┬────┘                                  │
              │ (sync attempt)                        │ (retry after backoff)
              ▼                                       │
         ┌─────────┐   success    ┌────────┐         │
         │ syncing │ ───────────→ │ synced │ →[delete]│
         └────┬────┘              └────────┘         │
              │ failure                               │
              ▼                                       │
         ┌───────┐   attempts < MAX                   │
         │ error │ ─────────────────────────────────→─┘
         └───────┘   attempts >= MAX → stays in error (manual review)
```

### Retry Policy
- Max attempts: 3
- Trigger: on connectivity restore (NetInfo listener)
- Conflict resolution: last-write-wins (server authoritative on sync)
- Error recovery: entries in `error` state with MAX attempts are surfaced in the Settings screen for manual retry or deletion

### WatermelonDB choice
WatermelonDB provides:
- SQLite-backed reactive queries (observable collections for UI)
- JSI bridge for synchronous SQLite access (avoids bridge bottleneck)
- Built-in `sync()` protocol hook (not used here — custom outbox preferred for full control)

---

## 4. Network Discovery Strategy

### Phase 1: mDNS/Bonjour (passive)
- Uses `react-native-zeroconf` to listen for `_services._dns-sd._udp.local.` announcements
- Duration: 5 seconds
- Captures: IP, hostname, service type

### Phase 2: TCP probe scan (active, ARP-like)
- True ARP requires root/privileged sockets — not available to normal Android apps
- Instead: TCP connect attempt to ports [80, 443, 22, 8080, 161] with 400ms timeout
- A host is "online" if any port accepts a connection
- Scan concurrency: 20 parallel probes

### Limitations
- Cannot detect hosts that drop all TCP connections silently (firewall DROP rules)
- No ICMP ping (requires root on Android)
- For real ARP, a rooted device or a companion native module would be needed

---

## 5. Architecture Decisions (SOLID mapping)

| Principle | Applied Where |
|-----------|--------------|
| **S** — Single Responsibility | Each use case does exactly one thing (ScanNetwork, QuerySnmp, etc.) |
| **O** — Open/Closed | New protocol adapters (SNMPv3, Telnet) can be added without changing use cases |
| **L** — Liskov Substitution | Mock implementations of ISnmpClient, ISshClient usable in tests |
| **I** — Interface Segregation | Ports split by concern: ISnmpClient, ISshClient, IGeolocationService are independent |
| **D** — Dependency Inversion | Use cases depend on port interfaces, not concrete adapters |

---

## 6. Folder Structure

```
src/
├── domain/                  # Zero dependencies — pure TypeScript
│   ├── entities/            # Device, InstallationReport, OutboxEntry
│   ├── repositories/        # IDeviceRepository, IReportRepository, IOutboxRepository
│   └── ports/               # ISnmpClient, ISshClient, IGeolocationService…
│
├── infrastructure/          # Platform adapters — implement domain ports
│   ├── protocols/
│   │   ├── snmp/            # SnmpPduCodec (BER/ASN.1), SnmpClient
│   │   └── ssh/             # SshClientAdapter
│   ├── network/             # NetworkScanner (mDNS + TCP probe)
│   ├── database/            # WatermelonDB schema, models, singleton
│   ├── repositories/        # DeviceRepository, OutboxRepository
│   ├── security/            # SecureCredentialStore (Keychain)
│   ├── location/            # GeolocationAdapter
│   ├── reporting/           # PdfGeneratorAdapter
│   └── sync/                # ConnectivityMonitor
│
├── application/             # Orchestration layer
│   ├── usecases/            # ScanNetwork, QuerySnmp, RunSsh, CreateReport, SyncOutbox
│   ├── templates/           # ReportHtmlTemplate
│   └── container.ts         # Manual DI wiring
│
└── presentation/            # React Native UI
    ├── theme/               # Colors, Typography, Spacing tokens
    ├── components/
    │   ├── atoms/           # Button, Card, Badge, Metric…
    │   └── molecules/       # DeviceCard, ScanProgressBar
    ├── screens/             # Dashboard, DeviceScan, SnmpQuery, SshDiagnostics, QrScanner, CreateReport
    └── navigation/          # AppNavigator, type-safe RootStackParamList
```
