import type {
  AnalyticsSummary,
  Product,
  ProductId,
  ProductInput,
  Store,
  StoreInput,
} from "@/backend";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useBackend } from "./use-backend";

/**
 * Merchant-scoped data hooks. Every call is caller-scoped on the backend
 * (`getMyStore`, `saveMyStore`, product CRUD, tour, analytics), so the
 * dashboard never needs to pass a store id.
 */

export const merchantKeys = {
  store: ["my-store"] as const,
  products: ["my-products"] as const,
  analytics: ["my-analytics"] as const,
};

/** Invalidate every merchant-scoped query after a catalog write. */
function invalidateMerchant(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: merchantKeys.store });
  void queryClient.invalidateQueries({ queryKey: merchantKeys.products });
}

export function useMyStore() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: merchantKeys.store,
    queryFn: async (): Promise<Store | null> => {
      if (!actor) return null;
      return actor.getMyStore();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveMyStore() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StoreInput): Promise<Store> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveMyStore(input);
    },
    onSuccess: () => {
      invalidateMerchant(queryClient);
    },
  });
}

export function useCreateProduct() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProductInput): Promise<Product> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createProduct(input);
    },
    onSuccess: () => {
      invalidateMerchant(queryClient);
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      productId: ProductId;
      input: ProductInput;
    }): Promise<Product> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProduct(vars.productId, vars.input);
    },
    onSuccess: () => {
      invalidateMerchant(queryClient);
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: ProductId): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteProduct(productId);
    },
    onSuccess: () => {
      invalidateMerchant(queryClient);
    },
  });
}

export function useSetProductInStock() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      productId: ProductId;
      inStock: boolean;
    }): Promise<Product> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setProductInStock(vars.productId, vars.inStock);
    },
    onSuccess: () => {
      invalidateMerchant(queryClient);
    },
  });
}

export function useSetMyTour() {
  const { actor } = useBackend();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      videoUrl: string | null;
      enabled: boolean;
    }): Promise<Store> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setMyTour(vars.videoUrl, vars.enabled);
    },
    onSuccess: () => {
      invalidateMerchant(queryClient);
    },
  });
}

/**
 * The merchant's own catalog. The backend exposes products by slug
 * (`getPublicProducts`), which returns every product for the store —
 * including out-of-stock items — so the owner sees the full list.
 */
export function useMyProducts(slug: string | undefined) {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: ["my-products", slug],
    queryFn: async (): Promise<Product[]> => {
      if (!actor || !slug) return [];
      return actor.getPublicProducts(slug);
    },
    enabled: !!actor && !isFetching && !!slug,
  });
}

export function useMyAnalytics() {
  const { actor, isFetching } = useBackend();
  return useQuery({
    queryKey: merchantKeys.analytics,
    queryFn: async (): Promise<AnalyticsSummary | null> => {
      if (!actor) return null;
      return actor.getMyAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

export type SlugAvailability = "idle" | "checking" | "available" | "taken";

/**
 * Debounced public-slug uniqueness check.
 *
 * The backend enforces uniqueness on write (`createStore`/`updateStore` trap
 * "Slug already taken"), but the UI must not claim a slug is "Available" until
 * that is actually confirmed. This queries the public lookup (`getPublicStore`)
 * after a short debounce and reports whether the slug is free.
 *
 * `currentSlug` is the merchant's own slug: when the typed slug matches it, the
 * slug is trivially available (it is already theirs) and no lookup is needed.
 */
export function useSlugAvailability(
  slug: string,
  formatValid: boolean,
  currentSlug?: string,
): SlugAvailability {
  const { actor, isFetching } = useBackend();
  const [debounced, setDebounced] = useState(slug);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(slug), 350);
    return () => window.clearTimeout(timer);
  }, [slug]);

  const isOwnSlug = !!currentSlug && slug === currentSlug;
  const shouldCheck =
    formatValid && !isOwnSlug && debounced === slug && !!actor && !isFetching;

  const { data, isFetching: isChecking } = useQuery({
    queryKey: ["slug-availability", debounced],
    queryFn: async (): Promise<boolean> => {
      if (!actor) return false;
      const existing = await actor.getPublicStore(debounced);
      return existing === null;
    },
    enabled: shouldCheck,
    staleTime: 30_000,
  });

  if (!formatValid) return "idle";
  if (isOwnSlug) return "available";
  if (debounced !== slug || isChecking) return "checking";
  if (data === undefined) return "checking";
  return data ? "available" : "taken";
}
