import { useState, lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/anoneurx/AppShell";
import { AccountCard } from "@/components/anoneurx/AccountCard";
import { EmptyState } from "@/components/anoneurx/EmptyState";
import { AccountDetailsDialog } from "@/components/anoneurx/AccountDetailsDialog";
import { ConfirmDialog } from "@/components/anoneurx/ConfirmDialog";
import { useTick } from "@/components/anoneurx/useTick";
import { useVault } from "@/store/vault";
import type { VaultAccount } from "@/lib/vault-types";
import { Button } from "@/components/ui/button";

import { authenticateDeviceLock } from "@/lib/device-lock";
import { toast } from "@/lib/notify";

const AddAccountModal = lazy(() => import("@/components/anoneurx/AddAccountModal").then(m => ({ default: m.AddAccountModal })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Authenticator — Anoneurx Authenticcator" },
      {
        name: "description",
        content: "View and manage your offline 2FA verification codes stored securely on this device.",
      },
    ],
  }),
  component: AuthenticatorScreen,
});

function AuthenticatorScreen() {
  const {
    accounts,
    filteredAccounts,
    searchQuery,
    setSearchQuery,
    updateAccount,
    deleteAccount,
  } = useVault();
  const now = useTick();

  // Dialog State
  const [selectedAccount, setSelectedAccount] = useState<VaultAccount | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<VaultAccount | null>(null);

  function handleOpenDetails(account: VaultAccount) {
    setSelectedAccount(account);
    setDetailsOpen(true);
  }

  function handleDeletePrompt(account: VaultAccount) {
    setAccountToDelete(account);
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Mobile Search Input */}
        {accounts.length > 0 && (
          <div className="md:hidden relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search accounts or issuers…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        {/* Accounts List View */}
        <div className="space-y-2.5">
          {accounts.length === 0 ? (
            <EmptyState onAdd={() => setAddModalOpen(true)} />
          ) : filteredAccounts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3 shadow-xs">
              <Search className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="text-base font-semibold text-foreground">No accounts found</h3>
              <p className="text-xs text-muted-foreground">
                No verification codes matched "{searchQuery}".
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="h-9 text-xs"
              >
                Clear search filter
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  now={now}
                  onOpen={() => handleOpenDetails(account)}
                  onEdit={() => handleOpenDetails(account)}
                  onDelete={() => handleDeletePrompt(account)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Details Dialog */}
      <AccountDetailsDialog
        account={selectedAccount}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onSave={(id, patch) => updateAccount(id, patch)}
        onDelete={(id) => deleteAccount(id)}
      />

      {/* Add Account Modal */}
      <Suspense fallback={null}>
        <AddAccountModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
        />
      </Suspense>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={accountToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAccountToDelete(null);
        }}
        title={`Delete ${accountToDelete?.issuer ?? "Account"}?`}
        destructive
        confirmLabel="Authenticate & Delete"
        description={
          <>
            <p>This removes the entry from your local device vault.</p>
            <p>
              Device lock / Passkey verification is required to confirm deletion.
            </p>
          </>
        }
        onConfirm={async () => {
          if (!accountToDelete) return;
          const verified = await authenticateDeviceLock(`delete ${accountToDelete.issuer}`);
          if (!verified) return;

          deleteAccount(accountToDelete.id);
          setAccountToDelete(null);
          toast.success("Account deleted from vault");
        }}
      />
    </AppShell>
  );
}
