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

const DEMO_SERVICES = [
  { issuer: "GitHub", account: "katy@github.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "GitLab", account: "katy@gitlab.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Google", account: "katy.dev@gmail.com", secret: "RZXW6YTBOI======" },
  { issuer: "Microsoft", account: "katy@outlook.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Discord", account: "katyw#1337", secret: "ORSW45DJN5XG433S" },
  { issuer: "Dropbox", account: "katy@dropbox.com", secret: "MZXW6YTBOI=======" },
  { issuer: "Facebook", account: "katyw.fb", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Instagram", account: "@katyw", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "X (Twitter)", account: "@katyw_dev", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "LinkedIn", account: "katy-wilson", secret: "ORSW45DJN5XG433S" },
  { issuer: "Reddit", account: "u/katy_dev", secret: "MZXW6YTBOI=======" },
  { issuer: "Amazon", account: "katy@amazon.com", secret: "RZXW6YTBOI======" },
  { issuer: "PayPal", account: "katy@paypal.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "eBay", account: "katy@ebay.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Cloudflare", account: "admin@cloudflare.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Atlassian", account: "katy@atlassian.com", secret: "ORSW45DJN5XG433S" },
  { issuer: "Slack", account: "katy@workspace.slack.com", secret: "MZXW6YTBOI=======" },
  { issuer: "Zoom", account: "katy@zoom.us", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Notion", account: "katy@notion.so", secret: "RZXW6YTBOI======" },
  { issuer: "Shopify", account: "katy@store.shopify.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Binance", account: "binance@katy.io", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Coinbase", account: "coinbase@katy.io", secret: "ORSW45DJN5XG433S" },
  { issuer: "Bitwarden", account: "katy@bitwarden.com", secret: "MZXW6YTBOI=======" },
  { issuer: "1Password", account: "katy@1password.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "LastPass", account: "katy@lastpass.com", secret: "RZXW6YTBOI======" },
  { issuer: "Proton Mail", account: "katy@proton.me", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Fastmail", account: "katy@fastmail.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Namecheap", account: "katy@namecheap.com", secret: "ORSW45DJN5XG433S" },
  { issuer: "Figma", account: "katyw@figma.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Vercel", account: "katy@vercel.app", secret: "MZXW6YTBOI=======" },
  { issuer: "Netlify", account: "katy@netlify.app", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "AWS", account: "admin@aws.amazon.com", secret: "RZXW6YTBOI======" },
  { issuer: "Stripe", account: "katy@stripe.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Twilio", account: "katy@twilio.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Heroku", account: "katy@heroku.com", secret: "ORSW45DJN5XG433S" },
  { issuer: "DigitalOcean", account: "katy@digitalocean.com", secret: "MZXW6YTBOI=======" },
  { issuer: "Datadog", account: "katy@datadoghq.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Okta", account: "katy@okta.com", secret: "RZXW6YTBOI======" },
  { issuer: "Auth0", account: "katy@auth0.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Oracle Cloud", account: "katy@oracle.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "SAP", account: "katy@sap.com", secret: "ORSW45DJN5XG433S" },
  { issuer: "Adobe", account: "katy@adobe.com", secret: "MZXW6YTBOI=======" },
  { issuer: "Epic Games", account: "katy@epicgames.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Steam", account: "katy_gamer", secret: "RZXW6YTBOI======" },
  { issuer: "Twitch", account: "katy_streamer", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "OpenAI", account: "katy@openai.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Perplexity", account: "katy@perplexity.ai", secret: "ORSW45DJN5XG433S" },
  { issuer: "Canva", account: "katy@canva.com", secret: "MZXW6YTBOI=======" },
  { issuer: "HubSpot", account: "katy@hubspot.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Zendesk", account: "katy@zendesk.com", secret: "RZXW6YTBOI======" },
  { issuer: "Asana", account: "katy@asana.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Monday.com", account: "katy@monday.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "ClickUp", account: "katy@clickup.com", secret: "ORSW45DJN5XG433S" },
  { issuer: "Linear", account: "katy@linear.app", secret: "MZXW6YTBOI=======" },
  { issuer: "Bitbucket", account: "katy@bitbucket.org", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "SourceForge", account: "katy@sourceforge.net", secret: "RZXW6YTBOI======" },
  { issuer: "WordPress.com", account: "katy@wordpress.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "GoDaddy", account: "katy@godaddy.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Wix", account: "katy@wix.com", secret: "ORSW45DJN5XG433S" },
  { issuer: "Squarespace", account: "katy@squarespace.com", secret: "MZXW6YTBOI=======" },
  { issuer: "Proton Drive", account: "katy@proton.me", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Proton VPN", account: "katy@proton.me", secret: "RZXW6YTBOI======" },
  { issuer: "Wise", account: "katy@wise.com", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "Payoneer", account: "katy@payoneer.com", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Kraken", account: "kraken@katy.io", secret: "ORSW45DJN5XG433S" },
  { issuer: "OKX", account: "okx@katy.io", secret: "MZXW6YTBOI=======" },
  { issuer: "KuCoin", account: "kucoin@katy.io", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Bybit", account: "bybit@katy.io", secret: "RZXW6YTBOI======" },
  { issuer: "MetaMask", account: "0x71C...39A", secret: "KRSXG5CTMVRXEZLU" },
  { issuer: "OpenSea", account: "0x71C...39A", secret: "NBSWY3DPFQQHO33S" },
  { issuer: "Roblox", account: "katy_roblox", secret: "ORSW45DJN5XG433S" },
  { issuer: "PlayStation Network", account: "katy_psn", secret: "MZXW6YTBOI=======" },
  { issuer: "Xbox", account: "katy_xbox@live.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Nintendo Account", account: "katy_nintendo", secret: "RZXW6YTBOI======" },
  { issuer: "2FAS", account: "katy@2fas.com", secret: "JBSWY3DPEHPK3PXP" },
  { issuer: "Accenture", account: "katy.w@accenture.com", secret: "QZXXE5DFOI=======" },
];

const SEED_ACCOUNTS: VaultAccount[] = DEMO_SERVICES.map((s, idx) => ({
  id: `seed-${s.issuer.toLowerCase().replace(/[^a-z0-9]/g, "")}-${idx}`,
  issuer: s.issuer,
  account: s.account,
  secret: s.secret,
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  createdAt: Date.now() - 86400000 * (75 - idx),
}));

export function VaultProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [state, setState] = useState<PersistedVault>(EMPTY_VAULT);
  const [locked, setLocked] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const available = isStorageAvailable();
    setStorageAvailable(available);
    const loaded = loadVault();

    let next: PersistedVault;
    if (!loaded) {
      next = { ...EMPTY_VAULT, accounts: SEED_ACCOUNTS, settings: DEFAULT_SETTINGS };
    } else {
      // Merge seed accounts if user has fewer accounts than seeds
      const existingMap = new Set(loaded.accounts.map((a) => a.issuer.toLowerCase()));
      const missingSeeds = SEED_ACCOUNTS.filter((s) => !existingMap.has(s.issuer.toLowerCase()));
      next = {
        ...loaded,
        accounts: [...loaded.accounts, ...missingSeeds],
      };
    }

    setState(next);
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
