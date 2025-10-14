
'use client';

// src/context/vault/VaultProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { encryptJSON, decryptJSON } from "@/lib/client-crypto";
import type { CipherPackage } from "@/lib/client-crypto";
import { loadVault, saveVault, wipeVault } from "@/lib/storage";

export type VaultData = any; // Will hold the entire app state { cbtEntries, exposureState, etc. }

type VaultContextType = {
  locked: boolean;
  hasVault: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  createVault: (password: string, initialData?: VaultData) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  getData: () => VaultData | null;
  setData: (d: VaultData) => Promise<void>;
  wipe: () => Promise<void>;
  attemptsLeft: number;
  lockedUntil: number | null; // timestamp ms
  isChangingPassword: boolean;
};

const ctx = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const c = useContext(ctx);
  if (!c) throw new Error("useVault must be used within VaultProvider");
  return c;
};

const ATTEMPT_LIMIT = 5;
const LOCK_BASE_MS = 30_000; // 30s base wait time, exponential backoff
const AUTOLOCK_MINUTES = 3;

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasVault, setHasVault] = useState<boolean>(false);
  const [locked, setLocked] = useState<boolean>(true);
  const [pkg, setPkg] = useState<CipherPackage | null>(null);
  const [data, setDataState] = useState<VaultData | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(ATTEMPT_LIMIT);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const passwordRef = useRef<string|null>(null); // Store password in memory only while unlocked
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // load vault existence on mount
  useEffect(() => {
    (async () => {
      const existing = await loadVault();
      if (existing) {
        setPkg(existing as CipherPackage);
        setHasVault(true);
        setLocked(true);
      } else {
        setHasVault(false);
        setLocked(false); // No vault, so not locked
      }
    })();
  }, []);

  const lock = useCallback(() => {
    setDataState(null);
    passwordRef.current = null;
    setLocked(true);
  }, []);

  // auto-lock on visibility change / inactivity
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
        clearTimeout(inactivityTimer);
        if (!locked) {
             inactivityTimer = setTimeout(lock, AUTOLOCK_MINUTES * 60 * 1000);
        }
    };
    
    const onVis = () => {
      if (document.visibilityState === "hidden" && !locked) {
        lock();
      }
    };
    
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    resetTimer();

    return () => {
        document.removeEventListener("visibilitychange", onVis);
        window.removeEventListener('mousemove', resetTimer);
        window.removeEventListener('keydown', resetTimer);
        clearTimeout(inactivityTimer);
    };
  }, [locked, lock]);


  const createVault = useCallback(async (password: string, initialData: VaultData = {}) => {
    const encrypted = await encryptJSON(initialData, password);
    await saveVault(encrypted);
    setPkg(encrypted);
    setHasVault(true);
    setLocked(false);
    setDataState(initialData);
    setAttemptsLeft(ATTEMPT_LIMIT);
    setFailedAttempts(0);
    passwordRef.current = password;
  }, []);

  const unlock = useCallback(async (password: string) => {
    if (!pkg) return false;

    // check lockout
    if (lockedUntil && Date.now() < lockedUntil) return false;

    try {
      const d = await decryptJSON(pkg, password);
      setDataState(d);
      setLocked(false);
      setAttemptsLeft(ATTEMPT_LIMIT);
      setFailedAttempts(0);
      setLockedUntil(null);
      passwordRef.current = password; // Store password in memory
      return true;
    } catch (err) {
      const newFailed = failedAttempts + 1;
      setFailedAttempts(newFailed);
      const left = Math.max(0, ATTEMPT_LIMIT - newFailed);
      setAttemptsLeft(left);
      if (newFailed >= ATTEMPT_LIMIT) {
        // lockout with exponential backoff
        const ms = LOCK_BASE_MS * Math.pow(2, newFailed - ATTEMPT_LIMIT);
        setLockedUntil(Date.now() + ms);
      }
      return false;
    }
  }, [pkg, failedAttempts, lockedUntil]);

  const setData = useCallback(async (d: VaultData) => {
      if (locked || !passwordRef.current) {
          console.error("Attempted to set data while vault is locked or password is not available.");
          return;
      }
      setDataState(d);
      // Re-encrypt and save data with the stored password
      const encrypted = await encryptJSON(d, passwordRef.current);
      await saveVault(encrypted);
      setPkg(encrypted);
  }, [locked]);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
        if (locked) {
            throw new Error("Vault must be unlocked to change password.");
        }
        
        setIsChangingPassword(true);
        try {
            const currentPkg = await loadVault();
            if (!currentPkg) throw new Error("No vault found.");
            
            let decryptedData;
            try {
                decryptedData = await decryptJSON(currentPkg, currentPassword);
            } catch (e) {
                return false; // Incorrect current password
            }

            const newPkg = await encryptJSON(decryptedData, newPassword);
            await saveVault(newPkg);
            setPkg(newPkg);
            passwordRef.current = newPassword; // Update in-memory password
            return true;
        } finally {
            setIsChangingPassword(false);
        }
    }, [locked]);

  const wipe = useCallback(async () => {
    await wipeVault();
    setPkg(null);
    setDataState(null);
    setHasVault(false);
    setLocked(false);
    setAttemptsLeft(ATTEMPT_LIMIT);
    setFailedAttempts(0);
    setLockedUntil(null);
    passwordRef.current = null;
  }, []);


  const value = useMemo<VaultContextType>(() => ({
    locked,
    hasVault,
    unlock,
    lock,
    createVault,
    changePassword,
    getData: () => data,
    setData,
    wipe,
    attemptsLeft,
    lockedUntil,
    isChangingPassword,
  }), [locked, hasVault, unlock, lock, createVault, changePassword, data, setData, wipe, attemptsLeft, lockedUntil, isChangingPassword]);

  return <ctx.Provider value={value}>{children}</ctx.Provider>;
};

    