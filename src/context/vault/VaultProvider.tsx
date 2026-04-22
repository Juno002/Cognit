
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { encryptVault, decryptVault } from "@/lib/client-crypto";
import type { CipherPackage } from "@/lib/client-crypto";
import { loadVault, saveVault, wipeVault } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { normalizeVaultData } from './schema';
import type { VaultData } from './schema';
import pako from 'pako';

export { CURRENT_VAULT_SCHEMA_VERSION, createDefaultVaultData, normalizeVaultData } from './schema';
export type { ThoughtFormDraft, VaultData, VaultDrafts } from './schema';

type VaultContextType = {
  locked: boolean;
  hasVault: boolean;
  unlock: (password: string) => Promise<{ success: boolean; error?: 'decryption' | 'locked' }>;
  lock: () => void;
  createVault: (password: string, initialData?: VaultData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  getData: () => VaultData | null;
  getRawVault: () => ArrayBuffer | null;
  getEncryptedPackage: () => CipherPackage | null;
  setData: (d: VaultData) => Promise<void>;
  replaceData: (d: Partial<VaultData>) => Promise<void>;
  importEncryptedPackage: (pkg: CipherPackage) => Promise<void>;
  wipe: () => Promise<void>;
  attemptsLeft: number;
  lockedUntil: number | null;
  isChangingPassword: boolean;
  encryptVault: (plainBuffer: ArrayBuffer, password: string) => Promise<CipherPackage>;
};

const ctx = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const c = useContext(ctx);
  if (!c) throw new Error("useVault must be used within VaultProvider");
  return c;
};

const ATTEMPT_LIMIT = 5;
const LOCK_BASE_MS = 30_000;
const AUTOLOCK_MINUTES = 10;
const BACKGROUND_LOCK_GRACE_MS = 5 * 60 * 1000; // 5 minutes grace period
const LOCKOUT_STORAGE_KEY = "cognit_vault_lockout";

type PersistedLockout = {
  failedAttempts: number;
  lockedUntil: number | null;
};

const inflateVaultData = (buffer: ArrayBuffer, defaultCopingPhrase: string): VaultData => {
  try {
    const decompressed = pako.inflate(new Uint8Array(buffer), { to: 'string' });
    return normalizeVaultData(JSON.parse(decompressed), defaultCopingPhrase);
  } catch (_compressedError) {
    const decoded = new TextDecoder().decode(buffer);
    return normalizeVaultData(JSON.parse(decoded), defaultCopingPhrase);
  }
};

const getPersistedLockout = (): PersistedLockout => {
  if (typeof window === 'undefined') return { failedAttempts: 0, lockedUntil: null };

  try {
    const stored = window.localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (!stored) return { failedAttempts: 0, lockedUntil: null };

    const parsed = JSON.parse(stored) as Partial<PersistedLockout>;
    const lockedUntil = typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null;
    const failedAttempts = typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0;

    if (lockedUntil && Date.now() >= lockedUntil) {
      window.localStorage.removeItem(LOCKOUT_STORAGE_KEY);
      return { failedAttempts: 0, lockedUntil: null };
    }

    return { failedAttempts, lockedUntil };
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
};

const persistLockout = ({ failedAttempts, lockedUntil }: PersistedLockout) => {
  if (typeof window === 'undefined') return;

  if (failedAttempts <= 0 && !lockedUntil) {
    window.localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify({ failedAttempts, lockedUntil }));
};

const clearPersistedLockout = () => persistLockout({ failedAttempts: 0, lockedUntil: null });

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [hasVault, setHasVault] = useState<boolean>(false);
  const [locked, setLocked] = useState<boolean>(true);
  const [pkg, setPkg] = useState<CipherPackage | null>(null);
  const [data, setDataState] = useState<VaultData | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(ATTEMPT_LIMIT);
  const failedAttemptsRef = useRef<number>(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const passwordRef = useRef<string|null>(null);
  const backgroundTimestampRef = useRef<number | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return;
      const persisted = getPersistedLockout();
      failedAttemptsRef.current = persisted.failedAttempts;
      setAttemptsLeft(Math.max(0, ATTEMPT_LIMIT - persisted.failedAttempts));
      setLockedUntil(persisted.lockedUntil);

      const existing = await loadVault();
      if (existing) {
        setPkg(existing as CipherPackage);
        setHasVault(true);
        setLocked(true);
      } else {
        setHasVault(false);
        setLocked(false);
      }
    })();
  }, []);

  const lock = useCallback(() => {
    setDataState(null);
    passwordRef.current = null;
    setLocked(true);
  }, []);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        if (!locked) {
             inactivityTimer = setTimeout(lock, AUTOLOCK_MINUTES * 60 * 1000);
        }
    };
    
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        backgroundTimestampRef.current = Date.now();
        // We don't lock immediately. The timer or the next visibilitychange to 'visible' will check.
      } else if (document.visibilityState === "visible") {
        if (backgroundTimestampRef.current && !locked) {
          const elapsed = Date.now() - backgroundTimestampRef.current;
          if (elapsed > BACKGROUND_LOCK_GRACE_MS) {
            lock();
            toast({
              title: t('vault_locked_title') || "Bóveda Bloqueada",
              description: t('vault_locked_background_desc') || "La sesión expiró mientras la aplicación estaba en segundo plano.",
            });
          }
        }
        backgroundTimestampRef.current = null;
      }
    };
    
    if (typeof window !== 'undefined') {
        document.addEventListener("visibilitychange", onVis);
        window.addEventListener('pointerdown', resetTimer, { passive: true });
        window.addEventListener('touchstart', resetTimer, { passive: true });
        window.addEventListener('mousemove', resetTimer, { passive: true });
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('scroll', resetTimer, { passive: true });
        resetTimer();
    }

    return () => {
        if (typeof window !== 'undefined') {
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener('pointerdown', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('scroll', resetTimer);
            clearTimeout(inactivityTimer);
        }
    };
  }, [locked, lock, t, toast]);


  const createVault = useCallback(async (password: string, initialData?: VaultData) => {
    const vaultData = normalizeVaultData(initialData, t('default_coping_phrase'));
    const dataString = JSON.stringify(vaultData);
    const compressed = pako.deflate(dataString);
    const encrypted = await encryptVault(compressed.buffer, password);

    await saveVault(encrypted);
    setPkg(encrypted);
    setHasVault(true);
    setLocked(false);
    setDataState(vaultData);
    setAttemptsLeft(ATTEMPT_LIMIT);
    failedAttemptsRef.current = 0;
    setLockedUntil(null);
    clearPersistedLockout();
    passwordRef.current = password;
  }, [t]);

  const unlock = useCallback(async (password: string) => {
    if (!pkg) return { success: false, error: 'decryption' as const };

    if (lockedUntil && Date.now() < lockedUntil) return { success: false, error: 'locked' as const };
    if (lockedUntil && Date.now() >= lockedUntil) {
      setLockedUntil(null);
      setAttemptsLeft(ATTEMPT_LIMIT);
      failedAttemptsRef.current = 0;
      clearPersistedLockout();
    }

    const decryptedBuffer = await decryptVault(pkg, password);

    if (decryptedBuffer) {
      try {
        const d = inflateVaultData(decryptedBuffer, t('default_coping_phrase'));
        const compressed = pako.deflate(JSON.stringify(d));
        const migratedPkg = await encryptVault(compressed.buffer, password);
        await saveVault(migratedPkg);
        setPkg(migratedPkg);
        setDataState(d);
        setLocked(false);
        failedAttemptsRef.current = 0;
        setAttemptsLeft(ATTEMPT_LIMIT);
        setLockedUntil(null);
        clearPersistedLockout();
        passwordRef.current = password;
        return { success: true };
      } catch (_e) {
        return { success: false, error: 'decryption' as const };
      }
    } else {
      failedAttemptsRef.current += 1;
      const left = Math.max(0, ATTEMPT_LIMIT - failedAttemptsRef.current);
      setAttemptsLeft(left);
      if (left === 0) {
        const lockoutDuration = LOCK_BASE_MS * Math.pow(2, failedAttemptsRef.current - ATTEMPT_LIMIT);
        const newLockedUntil = Date.now() + lockoutDuration;
        setLockedUntil(newLockedUntil);
        persistLockout({ failedAttempts: failedAttemptsRef.current, lockedUntil: newLockedUntil });
        return { success: false, error: 'locked' as const };
      }
      persistLockout({ failedAttempts: failedAttemptsRef.current, lockedUntil: null });
      return { success: false, error: 'decryption' as const };
    }
  }, [pkg, lockedUntil, t]);

  const setData = useCallback(async (d: VaultData) => {
      if (locked || !passwordRef.current) {
          console.error("Attempted to set data while vault is locked or password is not available.");
           toast({
              title: "Error: Vault Locked",
              description: "Cannot save data while the vault is locked.",
              variant: "destructive",
          });
          return;
      }
      const normalizedData = normalizeVaultData(d, t('default_coping_phrase'));
      setDataState(normalizedData);
      
      const dataString = JSON.stringify(normalizedData);
      const compressed = pako.deflate(dataString);
      const encrypted = await encryptVault(compressed.buffer, passwordRef.current);
      await saveVault(encrypted);
      setPkg(encrypted);
  }, [locked, t, toast]);

  const replaceData = useCallback(async (d: Partial<VaultData>) => {
      await setData(normalizeVaultData(d, t('default_coping_phrase')));
  }, [setData, t]);

  const importEncryptedPackage = useCallback(async (encryptedPackage: CipherPackage) => {
      if (locked || !passwordRef.current) {
          throw new Error("Vault must be unlocked to import an encrypted backup.");
      }

      const decryptedBuffer = await decryptVault(encryptedPackage, passwordRef.current);
      if (!decryptedBuffer) {
          throw new Error("The backup could not be decrypted with the current vault password.");
      }

      const importedData = inflateVaultData(decryptedBuffer, t('default_coping_phrase'));
      await setData(importedData);
  }, [locked, setData, t]);

  const getRawVault = useCallback(() => {
    if (!data || typeof window === 'undefined') return null;
    try {
      const normalizedData = normalizeVaultData(data, t('default_coping_phrase'));
      const dataString = JSON.stringify(normalizedData);
      const compressed = pako.deflate(dataString);
      return compressed.buffer;
    } catch (e) {
      console.error("Failed to get raw vault:", e);
      return null;
    }
  }, [data, t]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
      if (locked) {
          throw new Error("Vault must be unlocked to change password.");
      }
      
      setIsChangingPassword(true);
      try {
          if (!pkg) return false;
          const verifiedVault = await decryptVault(pkg, currentPassword);
          if (!verifiedVault) return false;

          const rawVaultBuffer = getRawVault();
          if (!rawVaultBuffer) return false;

          // The raw vault is already compressed. Re-encrypt with the new password.
          const newPkg = await encryptVault(rawVaultBuffer, newPassword);
          await saveVault(newPkg);
          
          setPkg(newPkg);
          passwordRef.current = newPassword;
          return true;
      } catch (e) {
        console.error("Password change failed:", e);
        return false;
      } finally {
          setIsChangingPassword(false);
      }
  }, [locked, pkg, getRawVault]);

  const wipe = useCallback(async () => {
    await wipeVault();
    setPkg(null);
    setDataState(null);
    setHasVault(false);
    setLocked(false);
    setAttemptsLeft(ATTEMPT_LIMIT);
    failedAttemptsRef.current = 0;
    setLockedUntil(null);
    passwordRef.current = null;
    clearPersistedLockout();
    toast({ title: t('toast_journal_reset_title'), description: t('toast_journal_reset_desc') });
  }, [t, toast]);


  const value = useMemo<VaultContextType>(() => ({
    locked,
    hasVault,
    unlock,
    lock,
    createVault,
    changePassword,
    getData: () => data,
    getRawVault,
    getEncryptedPackage: () => pkg,
    setData,
    replaceData,
    importEncryptedPackage,
    wipe,
    attemptsLeft,
    lockedUntil,
    isChangingPassword,
    encryptVault,
  }), [locked, hasVault, unlock, lock, createVault, changePassword, data, pkg, getRawVault, setData, replaceData, importEncryptedPackage, wipe, attemptsLeft, lockedUntil, isChangingPassword]);

  return React.createElement(ctx.Provider, { value }, children);
};
