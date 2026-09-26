import type { StoreAdminView } from "@/backend";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { StoreTable } from "@/components/admin/StoreTable";
import { Button } from "@/components/ui/button";
import { useBackend } from "@/hooks/use-backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";

/**
 * Admin control panel. Admin-only (the route gate redirects non-admins).
 * Shows system metrics and a per-store permission table with an immediate
 * Continue/Pause toggle.
 */
export function AdminDashboardPage() {
  const { actor, isFetching } = useBackend();
  const queryClient = useQueryClient();
  const [pendingStoreId, setPendingStoreId] = useState<string | null>(null);

  const metricsQuery = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getSystemMetrics();
    },
    enabled: !!actor && !isFetching,
  });

  const storesQuery = useQuery({
    queryKey: ["admin-stores"],
    queryFn: async (): Promise<StoreAdminView[]> => {
      if (!actor) return [];
      return actor.listAllStores();
    },
    enabled: !!actor && !isFetching,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      storeId,
      active,
      note,
    }: {
      storeId: string;
      active: boolean;
      note: string | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setStoreActive(storeId, active, note);
    },
    onMutate: ({ storeId }) => {
      setPendingStoreId(storeId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    },
    onSettled: () => {
      setPendingStoreId(null);
    },
  });

  const stores = storesQuery.data ?? [];
  const isStoresLoading = storesQuery.isLoading;
  const hasError = storesQuery.isError || metricsQuery.isError;

  const handleToggle = (
    storeId: string,
    active: boolean,
    note: string | null,
  ) => {
    toggleMutation.mutate({ storeId, active, note });
  };

  const handleRetry = () => {
    void storesQuery.refetch();
    void metricsQuery.refetch();
  };

  return (
    <div
      data-ocid="admin.page"
      className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-secondary-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Admin
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
            Control panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor every store and control who can sell right now.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="admin.refresh_button"
          onClick={handleRetry}
          disabled={storesQuery.isFetching || metricsQuery.isFetching}
          className="w-fit rounded-full"
        >
          <RefreshCw
            className={`size-4 ${storesQuery.isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </header>

      <div className="mt-6">
        <MetricsCards
          metrics={metricsQuery.data ?? undefined}
          isLoading={metricsQuery.isLoading}
        />
      </div>

      {hasError && (
        <div
          data-ocid="admin.error_state"
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Could not load the store list
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Check your connection and try again.
            </p>
          </div>
        </div>
      )}

      <section className="mt-8" aria-labelledby="admin-stores-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="admin-stores-heading"
            className="font-display text-lg font-bold tracking-tight text-foreground"
          >
            Store permissions
          </h2>
          {!isStoresLoading && stores.length > 0 && (
            <span className="font-mono text-xs text-muted-foreground">
              {stores.length} {stores.length === 1 ? "store" : "stores"}
            </span>
          )}
        </div>

        <StoreTable
          stores={stores}
          isLoading={isStoresLoading}
          pendingStoreId={pendingStoreId}
          onToggle={handleToggle}
        />
      </section>
    </div>
  );
}
