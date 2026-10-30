/**
 * Use Case: Connect via SSH and execute diagnostic commands (RF-03).
 * Credentials loaded from SecureCredentialStore — never from user input directly.
 */
import type { ISshClient, ICredentialStore } from '../../domain/ports';
import type { SshDiagnosticResult } from '../../domain/entities/Device';
import { DEFAULT_DIAGNOSTIC_COMMANDS } from '../../infrastructure/protocols/ssh/SshClientAdapter';

export interface SshDiagnosticInput {
  host: string;
  port?: number;
  credentialKey: string; // key in the secure store, e.g. "ssh:192.168.1.1"
  commands?: string[];   // override default commands
}

export class RunSshDiagnosticsUseCase {
  constructor(
    private readonly sshClient: ISshClient,
    private readonly credentialStore: ICredentialStore,
  ) {}

  async execute(input: SshDiagnosticInput): Promise<SshDiagnosticResult> {
    const creds = await this.credentialStore.load(input.credentialKey);
    if (!creds) {
      throw new Error(
        `No credentials found for key "${input.credentialKey}". ` +
        'Save credentials via the device settings screen first.',
      );
    }

    try {
      await this.sshClient.connect(input.host, input.port ?? 22, {
        username: creds.username,
        password: creds.password,
      });

      const commands = input.commands ?? DEFAULT_DIAGNOSTIC_COMMANDS;
      return await this.sshClient.executeCommands(commands);
    } finally {
      await this.sshClient.disconnect();
    }
  }
}
