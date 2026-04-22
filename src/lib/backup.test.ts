import { describe, expect, it } from 'vitest';
import { createCognitBackupEnvelope, isCognitBackupEnvelope, readCognitBackupPayload } from './backup';

const bytes = (values: number[]) => new Uint8Array(values).buffer;
const toArray = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer));

describe('cognit backup envelope', () => {
  it('wraps and restores an encrypted vault payload with integrity metadata', async () => {
    const payload = bytes([1, 2, 3, 4, 5]);

    const envelope = await createCognitBackupEnvelope(payload);
    const restored = await readCognitBackupPayload(envelope);

    expect(isCognitBackupEnvelope(envelope)).toBe(true);
    expect(envelope.kind).toBe('cognit-backup');
    expect(envelope.version).toBe(2);
    expect(envelope.format).toBe('encrypted-vault');
    expect(toArray(restored)).toEqual([1, 2, 3, 4, 5]);
  });

  it('rejects a backup when the payload hash does not match', async () => {
    const envelope = await createCognitBackupEnvelope(bytes([9, 8, 7]));

    await expect(
      readCognitBackupPayload({
        ...envelope,
        payloadBase64: 'AAAA',
      })
    ).rejects.toThrow('Backup integrity check failed.');
  });
});
