/**
 * Secure credential store — wraps react-native-keychain.
 * Implements ICredentialStore port.
 *
 * Passwords are NEVER stored in plaintext (AsyncStorage, SQLite, etc.).
 * All sensitive data lives exclusively in the platform's secure enclave
 * (Keychain on iOS, Keystore on Android).
 *
 * OWASP Mobile reference: M9 — Insecure Data Storage.
 */
import * as Keychain from 'react-native-keychain';
import type { ICredentialStore } from '../../domain/ports';

export class SecureCredentialStore implements ICredentialStore {
  async save(key: string, username: string, password: string): Promise<void> {
    await Keychain.setInternetCredentials(key, username, password);
  }

  async load(key: string): Promise<{ username: string; password: string } | null> {
    const result = await Keychain.getInternetCredentials(key);
    if (!result) {return null;}
    return { username: result.username, password: result.password };
  }

  async delete(key: string): Promise<void> {
    await Keychain.resetInternetCredentials(key);
  }
}
