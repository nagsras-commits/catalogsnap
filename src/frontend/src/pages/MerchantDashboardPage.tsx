import type { Product } from "@/backend";
import { StoreAnalytics } from "@/components/merchant/AnalyticsSummary";
import { ProductFormDialog } from "@/components/merchant/ProductFormDialog";
import { ProductList } from "@/components/merchant/ProductList";
import { ShareTools } from "@/components/merchant/ShareTools";
import { StoreSettingsForm } from "@/components/merchant/StoreSettingsForm";
import { TourUploader } from "@/components/merchant/TourUploader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  useMyAnalytics,
  useMyProducts,
  useMyStore,
} from "@/hooks/use-merchant";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  PauseCircle,
  Store as StoreIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Merchant dashboard: store settings, product management, tour uploader,
 * share tools, and analytics. Gated to the signed-in owner and only while
 * the store is active.
 */
export function MerchantDashboardPage() {
  const { principal } = useAuth();
  const navigate = useNavigate();
  const storeQuery = useMyStore();
  const analyticsQuery = useMyAnalytics();
  const productsQuery = useMyProducts(storeQuery.data?.store_slug);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const store = storeQuery.data;

  // Route the owner to onboarding when they have no store yet.
  useEffect(() => {
    if (storeQuery.isSuccess && store === null) {
      void navigate({ to: "/onboarding" });
    }
  }, [storeQuery.isSuccess, store, navigate]);

  // Paused stores are managed from the dedicated paused screen.
  useEffect(() => {
    if (store && !store.is_active) {
      void navigate({ to: "/account-paused" });
    }
  }, [store, navigate]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setFormOpen(true);
  }

  if (storeQuery.isLoading || (storeQuery.isSuccess && store === null)) {
    return (
      <div
        data-ocid="dashboard.loading_state"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Loading your dashboard</span>
      </div>
    );
  }

  if (storeQuery.isError || !store) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div
          data-ocid="dashboard.error_state"
          className="rounded-2xl border border-destructive/40 bg-card p-6 text-center shadow-elevated"
        >
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-foreground">
            We couldn't load your dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button
            type="button"
            data-ocid="dashboard.retry_button"
            onClick={() => void storeQuery.refetch()}
            className="mt-5 rounded-full"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const products = productsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
      <header className="animate-fade-in-up">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Merchant dashboard
            </p>
            <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {store.store_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                <span
                  className="size-1.5 animate-pulse-live rounded-full bg-accent-foreground"
                  aria-hidden="true"
                />
                Live
              </span>
              <span className="truncate font-mono text-xs text-muted-foreground">
                /s/{store.store_slug}
              </span>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            data-ocid="dashboard.view_storefront_button"
            className="shrink-0 rounded-full"
          >
            <Link to="/s/$slug" params={{ slug: store.store_slug }} search={{}}>
              <ExternalLink className="size-4" aria-hidden="true" />
              View storefront
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="animate-fade-in-up space-y-5 [animation-delay:40ms]">
          <StoreSettingsForm store={store} />
          <ShareTools slug={store.store_slug} storeName={store.store_name} />
        </div>

        <div className="animate-fade-in-up space-y-5 [animation-delay:80ms]">
          <StoreAnalytics
            summary={analyticsQuery.data}
            isLoading={analyticsQuery.isLoading}
          />
          <TourUploader store={store} />
        </div>
      </div>

      <div className="mt-5 animate-fade-in-up [animation-delay:120ms]">
        <ProductList products={products} onAdd={openAdd} onEdit={openEdit} />
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <StoreIcon className="size-3.5" aria-hidden="true" />
        Signed in as{" "}
        <span className="font-mono">
          {principal ? `${principal.slice(0, 5)}…${principal.slice(-3)}` : "—"}
        </span>
      </p>
    </div>
  );
}
