import localforage from "localforage";
import type { CipherPackage } from './client-crypto';

localforage.config({
  name: "CognitVault",
  storeName: "vault",
  description: "Almacenamiento seguro para la bóveda cifrada de Cognit λ"
});

const VAULT_KEY = "ENCRYPTED_VAULT";

export async function saveVault(pkg: CipherPackage): Promise<CipherPackage> {
  return await localforage.setItem(VAULT_KEY, pkg);
}

export async function loadVault(): Promise<CipherPackage | null> {
  return await localforage.getItem(VAULT_KEY);
}

export async function wipeVault(): Promise<void> {
  return await localforage.removeItem(VAULT_KEY);
}
