/**
 * SSH Client adapter — wraps react-native-ssh-sftp.
 * Implements ISshClient port.
 *
 * Credentials are never persisted in plaintext — they must be loaded
 * from the SecureCredentialStore (Keychain/Keystore) before calling connect().
 *
 * Predefined diagnostic commands are vendor-agnostic defaults; callers
 * can override them via the executeCommands() call.
 */
import SSHClient from 'react-native-ssh-sftp';
import type { ISshClient, SshCredentials } from '../../../domain/ports';
import type { SshDiagnosticResult, CommandResult } from '../../../domain/entities/Device';

// Default set of diagnostic commands (RF-03)
export const DEFAULT_DIAGNOSTIC_COMMANDS = [
  'uptime',
  'uname -a',
  'ifconfig || ip addr show',
  'netstat -rn || ip route show',
  'df -h',
  'top -bn1 | head -20',
];

export class SshClientAdapter implements ISshClient {
  private client: SSHClient | null = null;
  private currentHost = '';
  private connected = false;

  async connect(host: string, port: number, credentials: SshCredentials): Promise<void> {
    if (this.connected) {
      await this.disconnect();
    }

    this.client = new SSHClient(
      host,
      String(port),
      credentials.username,
      credentials.password ?? '',
    );

    await this.client.connect();
    this.currentHost = host;
    this.connected = true;
  }

  async executeCommands(commands: string[]): Promise<SshDiagnosticResult> {
    if (!this.client || !this.connected) {
      throw new Error('SSH not connected. Call connect() first.');
    }

    const results: CommandResult[] = [];
    for (const command of commands) {
      const start = Date.now();
      try {
        const output: string = await this.client.execute(command);
        results.push({
          command,
          output: output ?? '',
          exitCode: 0,
          durationMs: Date.now() - start,
        });
      } catch (err: any) {
        results.push({
          command,
          output: err?.message ?? 'Error executing command',
          exitCode: 1,
          durationMs: Date.now() - start,
        });
      }
    }

    return {
      host: this.currentHost,
      commandsExecuted: results,
      executedAt: new Date(),
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } finally {
        this.client = null;
        this.connected = false;
        this.currentHost = '';
      }
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
