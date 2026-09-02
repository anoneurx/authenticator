import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  VaultAccount,
  VaultSettings,
  BackupStatus,
  OtpAlgorithm,
  OtpDigits,
} from "@/lib/vault-types";
import { DEFAULT_SETTINGS } from "@/lib/vault-types";
import type { VaultProfile, UnlockMethod } from "@/lib/identity";
import {
  EMPTY_VAULT,
  clearVault,
  isStorageAvailable,
  loadVault,
  saveVault,
  type PersistedVault,
} from "@/lib/vault-storage";
import { clearPasskey } from "@/lib/webauthn";
import { useAutoLock } from "@/hooks/use-auto-lock";
import { notifySystem } from "@/lib/notify";

export interface NewAccountInput {
  issuer: string;
  account: string;
  secret: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  period: number;
  label?: string;
  passkeyId?: string;
}

interface VaultContextValue {
  ready: boolean;
  storageAvailable: boolean;
  accounts: VaultAccount[];
  filteredAccounts: VaultAccount[];
  settings: VaultSettings;
  backup: BackupStatus;
  locked: boolean;
  profile: VaultProfile | null;
  setupComplete: boolean;
  completeSetup: (profile: VaultProfile) => void;
  resetProfile: () => void;
  /** Wipes the entire vault (profile + data) from this device. */
  deleteVaultProfile: () => void;
  setUnlockMethods: (methods: UnlockMethod[]) => void;
  updateProfile: (patch: Partial<VaultProfile>) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addAccount: (input: NewAccountInput) => VaultAccount;
  importAccounts: (accounts: VaultAccount[]) => number;
  updateAccount: (id: string, patch: Partial<VaultAccount>) => void;
  deleteAccount: (id: string) => void;
  lock: () => void;
  unlock: () => void;
  updateSettings: (patch: Partial<VaultSettings>) => void;
  recordBackup: (filename: string) => void;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [state, setState] = useState<PersistedVault>(EMPTY_VAULT);
  const [locked, setLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const available = isStorageAvailable();
    setStorageAvailable(available);
    const loaded = loadVault();

    let next: PersistedVault;
    if (!loaded) {
      next = { ...EMPTY_VAULT, settings: DEFAULT_SETTINGS };
    } else {
      next = loaded;
    }

    setState(next);
    // Lock only if profile exists AND requireAuthOnLaunch is enabled
    setLocked(Boolean(next.profile) && next.settings.requireAuthOnLaunch);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveVault(state);
  }, [state, ready]);

  // Theme application
  useEffect(() => {
    if (typeof document === "undefined") return;
    const pref = state.settings.theme;
    const prefersLight =
      pref === "light" ||
      (pref === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: light)").matches);
    document.documentElement.classList.toggle("theme-light", prefersLight);
    document.documentElement.classList.toggle("dark", !prefersLight);
  }, [state.settings.theme]);

  // Auto-lock: lock vault after inactivity period
  const lockFn = useCallback(() => {
    setLocked(true);
    notifySystem("Vault locked", "Your ANONEURX vault was locked for security.");
  }, []);
  useAutoLock(state.settings.autoLock, locked, lockFn);

  const addAccount = useCallback((input: NewAccountInput) => {
    const account: VaultAccount = {
      ...input,
      id: `acct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    setState((s) => ({ ...s, accounts: [account, ...s.accounts] }));
    return account;
  }, []);

  const importAccounts = useCallback((accounts: VaultAccount[]) => {
    let added = 0;
    setState((s) => {
      const existing = new Set(s.accounts.map((a) => `${a.issuer}|${a.account}`));
      const incoming = accounts.filter((a) => !existing.has(`${a.issuer}|${a.account}`));
      added = incoming.length;
      return { ...s, accounts: [...incoming, ...s.accounts] };
    });
    return accounts.length;
  }, []);

  const updateAccount = useCallback((id: string, patch: Partial<VaultAccount>) => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<VaultSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const completeSetup = useCallback((profile: VaultProfile) => {
    setState((s) => ({ ...s, profile }));
    setLocked(false);
  }, []);

  const resetProfile = useCallback(() => {
    setState((s) => ({ ...s, profile: null }));
    setLocked(false);
  }, []);

  const deleteVaultProfile = useCallback(() => {
    clearVault();
    clearPasskey();
    setState({ ...EMPTY_VAULT });
    setLocked(false);
  }, []);

  const setUnlockMethods = useCallback((methods: UnlockMethod[]) => {
    setState((s) => (s.profile ? { ...s, profile: { ...s.profile, enabledUnlock: methods } } : s));
  }, []);

  const updateProfile = useCallback((patch: Partial<VaultProfile>) => {
    setState((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s));
  }, []);

  const recordBackup = useCallback((filename: string) => {
    setState((s) => ({ ...s, backup: { lastBackupAt: Date.now(), lastFilename: filename } }));
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return state.accounts;
    return state.accounts.filter((a) =>
      [a.issuer, a.account, a.label ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [state.accounts, searchQuery]);

  const value: VaultContextValue = {
    ready,
    storageAvailable,
    accounts: state.accounts,
    filteredAccounts,
    settings: state.settings,
    backup: state.backup,
    locked,
    profile: state.profile,
    setupComplete: Boolean(state.profile),
    completeSetup,
    resetProfile,
    deleteVaultProfile,
    setUnlockMethods,
    updateProfile,
    searchQuery,
    setSearchQuery,
    addAccount,
    importAccounts,
    updateAccount,
    deleteAccount,
    lock: () => setLocked(true),
    unlock: () => setLocked(false),
    updateSettings,
    recordBackup,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
