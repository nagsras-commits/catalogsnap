import type { Product } from "@/backend";
import { CategoryChips } from "@/components/storefront/CategoryChips";
import { PausedBanner } from "@/components/storefront/PausedBanner";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreSearchBar } from "@/components/storefront/StoreSearchBar";
import { VideoTourPlayer } from "@/components/storefront/VideoTourPlayer";
import { useBackend } from "@/hooks/use-backend";
import { whatsappOrderLink } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import {
  Loader2,
  PackageOpen,
  SearchX,
  Store as StoreIcon,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface StorefrontSearch {
  q?: string;
  category?: string;
}

/**
 * Public customer storefront. Zero auth wall: store identity, catalog, search,
 * and category filters render for anyone with the link.
 */
export function StorefrontPage() {
  const { slug } = useParams({ from: "/s/$slug" });
  const search = useSearch({ from: "/s/$slug" }) as StorefrontSearch;
  const navigate = useNavigate();

  const { actor, isReady } = useBackend();
  const [tourOpen, setTourOpen] = useState(false);

  const storeQuery = useQuery({
    queryKey: ["publicStore", slug],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPublicStore(slug);
    },
    enabled: isReady,
  });

  const productsQuery = useQuery({
    queryKey: ["publicProducts", slug],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPublicProducts(slug);
    },
    enabled: isReady,
  });

  const store = storeQuery.data ?? null;
  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );

  // Record one visit per slug mount. Fire-and-forget; analytics never blocks UI.
  useEffect(() => {
    if (!isReady || !actor) return;
    void actor.recordStoreVisit(slug).catch(() => undefined);
  }, [actor, isReady, slug]);

  const query = search.q ?? "";
  const activeCategory = search.category ?? null;

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const product of products) {
      const category = product.category.trim();
      if (category) seen.add(category);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        !activeCategory || product.category === activeCategory;
      const matchesQuery =
        !needle || product.product_name.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, activeCategory]);

  const updateSearch = (next: StorefrontSearch) => {
    void navigate({
      to: "/s/$slug",
      params: { slug },
      search: { q: next.q || undefined, category: next.category || undefined },
      replace: true,
    });
  };

  const handleOrder = (product: Product) => {
    if (!store) return;
    const link = whatsappOrderLink(
      store.whatsapp_number,
      store.store_name,
      `${product.product_name} (${formatPriceInline(product.price)}) — ${window.location.href}`,
    );
    void actor?.recordWhatsappClick(slug).catch(() => undefined);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const isLoading = storeQuery.isLoading || productsQuery.isLoading;
  const notFound = !isLoading && !store;

  if (isLoading) {
    return (
      <div
        data-ocid="storefront.loading_state"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">Loading storefront</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        data-ocid="storefront.not_found_state"
        className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <StoreIcon className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-xl font-bold text-foreground">
          Store not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find a store at{" "}
          <span className="font-mono text-foreground">/s/{slug}</span>. Check
          the link and try again.
        </p>
      </div>
    );
  }

  const showTour = Boolean(store?.enable_video_tour && store.store_video_url);

  return (
    <div data-ocid="storefront.page" className="min-h-dvh bg-background">
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4 pb-3 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary font-display text-base font-bold text-primary-foreground">
              {store?.store_name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold tracking-tight text-foreground">
                {store?.store_name}
              </h1>
              <p className="truncate font-mono text-xs text-muted-foreground">
                /s/{store?.store_slug}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <StoreSearchBar
              value={query}
              onChange={(value) => updateSearch({ ...search, q: value })}
            />
          </div>

          <div className="mt-3">
            <CategoryChips
              categories={categories}
              active={activeCategory}
              onSelect={(category) =>
                updateSearch({ ...search, category: category ?? undefined })
              }
            />
          </div>
        </div>
      </div>

      {store && !store.is_active && <PausedBanner note={store.status_notes} />}

      <div className="mx-auto w-full max-w-3xl px-4 py-5">
        {filtered.length === 0 ? (
          <div
            data-ocid="storefront.empty_state"
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {products.length === 0 ? (
                <PackageOpen className="size-6" aria-hidden="true" />
              ) : (
                <SearchX className="size-6" aria-hidden="true" />
              )}
            </span>
            <h2 className="mt-3 font-display text-base font-semibold text-foreground">
              {products.length === 0
                ? "No products yet"
                : "No matching products"}
            </h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {products.length === 0
                ? "This store hasn't published any products. Check back soon."
                : "Try a different search term or clear the category filter."}
            </p>
            {products.length > 0 && (
              <button
                type="button"
                onClick={() => updateSearch({})}
                data-ocid="storefront.clear_filters_button"
                className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            data-ocid="storefront.product_grid"
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {filtered.map((product, index) => (
              <ProductCard
                key={product.product_id}
                product={product}
                index={index}
                onOrder={handleOrder}
              />
            ))}
          </div>
        )}
      </div>

      {showTour && store?.store_video_url && (
        <button
          type="button"
          onClick={() => setTourOpen(true)}
          data-ocid="storefront.video_tour_button"
          className="fixed bottom-5 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-float transition-smooth hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Video className="size-4" aria-hidden="true" />
          Virtual Shop Tour
        </button>
      )}

      {tourOpen && store?.store_video_url && (
        <VideoTourPlayer
          videoUrl={store.store_video_url}
          storeName={store.store_name}
          onClose={() => setTourOpen(false)}
        />
      )}
    </div>
  );
}

function formatPriceInline(price: number): string {
  return `$${price.toFixed(2)}`;
}
