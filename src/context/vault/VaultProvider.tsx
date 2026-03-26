
'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { encryptVault, decryptVault } from "@/lib/client-crypto";
import type { CipherPackage } from "@/lib/client-crypto";
import { loadVault, saveVault, wipeVault, saveRawVault } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import type { ExposureState, ActivationState, Achievement, CrisisConfig, Goal, GratitudeEntry, SleepEntry, TourState, ClinicalProfile } from '@/types';
import pako from 'pako';

export type VaultData = {
    cbtEntries: any[];
    exposureState: ExposureState;
    activationState: ActivationState;
    achievements: Achievement[];
    goals: Goal[];
    gratitudeEntries: GratitudeEntry[];
    sleepEntries: SleepEntry[];
    config: {
        [key: string]: any;
        crisisConfig: CrisisConfig;
        lastPrompt: string;
        ruminationCount: number;
        tourCompleted?: boolean; // Legacy
        tourState?: TourState;
        clinicalProfile?: ClinicalProfile;
        showTours?: boolean;
    }
};

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
  wipe: () => Promise<void>;
  attemptsLeft: number;
  lockedUntil: number | null;
  isChangingPassword: boolean;
  password: React.MutableRefObject<string|null>['current'];
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
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        resetTimer();
    }

    return () => {
        if (typeof window !== 'undefined') {
            document.removeEventListener("visibilitychange", onVis);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            clearTimeout(inactivityTimer);
        }
    };
  }, [locked, lock]);


  const createVault = useCallback(async (password: string, initialData?: VaultData) => {
    const defaultData: VaultData = { cbtEntries: [], exposureState: { fearLadder: [], logs: [] }, activationState: { values: [], activities: [] }, achievements: [], goals: [], gratitudeEntries: [], sleepEntries: [], config: { crisisConfig: { copingPhrase: '', contacts: [] }, lastPrompt: '', ruminationCount: 0, showTours: true } };
    const vaultData = initialData ?? defaultData;
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
    passwordRef.current = password;
  }, []);

  const unlock = useCallback(async (password: string) => {
    if (!pkg) return { success: false, error: 'decryption' as const };

    if (lockedUntil && Date.now() < lockedUntil) return { success: false, error: 'locked' as const };

    const decryptedBuffer = await decryptVault(pkg, password);

    if (decryptedBuffer) {
      try {
        const decompressed = pako.inflate(new Uint8Array(decryptedBuffer), { to: 'string' });
        const d = JSON.parse(decompressed);
        setDataState(d);
        setLocked(false);
        failedAttemptsRef.current = 0;
        setAttemptsLeft(ATTEMPT_LIMIT);
        setLockedUntil(null);
        passwordRef.current = password;
        return { success: true };
      } catch (e) {
        // Fallback for uncompressed old vaults
        try {
          const d = JSON.parse(new TextDecoder().decode(decryptedBuffer));
           setDataState(d);
           setLocked(false);
           passwordRef.current = password;
           return { success: true };
        } catch (finalError) {
             return { success: false, error: 'decryption' as const };
        }
      }
    } else {
      failedAttemptsRef.current += 1;
      const left = Math.max(0, ATTEMPT_LIMIT - failedAttemptsRef.current);
      setAttemptsLeft(left);
      if (left === 0) {
        const lockoutDuration = LOCK_BASE_MS * Math.pow(2, failedAttemptsRef.current - ATTEMPT_LIMIT);
        const newLockedUntil = Date.now() + lockoutDuration;
        setLockedUntil(newLockedUntil);
        return { success: false, error: 'locked' as const };
      }
      return { success: false, error: 'decryption' as const };
    }
  }, [pkg, lockedUntil]);

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
      setDataState(d);
      
      const dataString = JSON.stringify(d);
      const compressed = pako.deflate(dataString);
      const encrypted = await encryptVault(compressed.buffer, passwordRef.current);
      await saveVault(encrypted);
      setPkg(encrypted);
  }, [locked, toast]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
      if (locked) {
          throw new Error("Vault must be unlocked to change password.");
      }
      
      setIsChangingPassword(true);
      try {
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
  }, [locked, data]);

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
    toast({ title: t('toast_journal_reset_title'), description: t('toast_journal_reset_desc') });
  }, [t, toast]);

  const getRawVault = useCallback(() => {
    if (!data || typeof window === 'undefined') return null;
    try {
      const dataString = JSON.stringify(data);
      const compressed = pako.deflate(dataString);
      return compressed.buffer;
    } catch (e) {
      console.error("Failed to get raw vault:", e);
      return null;
    }
  }, [data]);


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
    wipe,
    attemptsLeft,
    lockedUntil,
    isChangingPassword,
    password: passwordRef.current,
    encryptVault,
  }), [locked, hasVault, unlock, lock, createVault, changePassword, data, pkg, getRawVault, setData, wipe, attemptsLeft, lockedUntil, isChangingPassword]);

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
};
