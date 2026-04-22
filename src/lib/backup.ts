import type { CipherPackage } from './client-crypto';
import { arrayBufferToBase64, base64ToArrayBuffer, sha256Base64 } from './arraybuffer-utils';

export const COGNIT_BACKUP_KIND = 'cognit-backup';
export const COGNIT_BACKUP_VERSION = 2;
export const COGNIT_BACKUP_FORMAT = 'encrypted-vault';

export type CognitBackupEnvelope = {
  kind: typeof COGNIT_BACKUP_KIND;
  version: typeof COGNIT_BACKUP_VERSION;
  format: typeof COGNIT_BACKUP_FORMAT;
  createdAt: string;
  payloadBase64: string;
  sha256Base64: string;
};

export function isCognitBackupEnvelope(value: unknown): value is CognitBackupEnvelope {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<CognitBackupEnvelope>;
  return (
    candidate.kind === COGNIT_BACKUP_KIND &&
    candidate.version === COGNIT_BACKUP_VERSION &&
    candidate.format === COGNIT_BACKUP_FORMAT &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.payloadBase64 === 'string' &&
    typeof candidate.sha256Base64 === 'string'
  );
}

export async function createCognitBackupEnvelope(pkg: CipherPackage): Promise<CognitBackupEnvelope> {
  return {
    kind: COGNIT_BACKUP_KIND,
    version: COGNIT_BACKUP_VERSION,
    format: COGNIT_BACKUP_FORMAT,
    createdAt: new Date().toISOString(),
    payloadBase64: arrayBufferToBase64(pkg),
    sha256Base64: await sha256Base64(pkg),
  };
}

export async function readCognitBackupPayload(envelope: CognitBackupEnvelope): Promise<CipherPackage> {
  const payload = base64ToArrayBuffer(envelope.payloadBase64);
  const actualHash = await sha256Base64(payload);

  if (!actualHash || actualHash !== envelope.sha256Base64) {
    throw new Error('Backup integrity check failed.');
  }

  return payload;
}
