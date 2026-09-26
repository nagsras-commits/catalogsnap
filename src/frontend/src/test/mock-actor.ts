import type {
  AnalyticsSummary,
  Product,
  Store,
  StoreAdminView,
  StorePublic,
  SystemMetrics,
  UserRole,
} from "@/backend";
import { UserRole as UserRoleEnum } from "@/backend";
import type { Session } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { vi } from "vitest";

/**
 * Typed local actor mock for the frontend suite.
 *
 * The app funnels every backend call through `useBackend`, so tests replace
 * that hook with a mock actor built from the app's own generated types. No
 * network, no real canister: this is component/integration coverage only.
 */
export interface MockActor {
  getPublicStore: ReturnType<typeof vi.fn>;
  getPublicProducts: ReturnType<typeof vi.fn>;
  recordStoreVisit: ReturnType<typeof vi.fn>;
  recordWhatsappClick: ReturnType<typeof vi.fn>;
  getMyStore: ReturnType<typeof vi.fn>;
  saveMyStore: ReturnType<typeof vi.fn>;
  createProduct: ReturnType<typeof vi.fn>;
  updateProduct: ReturnType<typeof vi.fn>;
  deleteProduct: ReturnType<typeof vi.fn>;
  setProductInStock: ReturnType<typeof vi.fn>;
  setMyTour: ReturnType<typeof vi.fn>;
  getMyAnalytics: ReturnType<typeof vi.fn>;
  listAllStores: ReturnType<typeof vi.fn>;
  getSystemMetrics: ReturnType<typeof vi.fn>;
  setStoreActive: ReturnType<typeof vi.fn>;
  getCallerUserRole: ReturnType<typeof vi.fn>;
  isCallerAdmin: ReturnType<typeof vi.fn>;
}

export function createMockActor(overrides: Partial<MockActor> = {}): MockActor {
  const actor: MockActor = {
    getPublicStore: vi.fn().mockResolvedValue(null),
    getPublicProducts: vi.fn().mockResolvedValue([]),
    recordStoreVisit: vi.fn().mockResolvedValue(undefined),
    recordWhatsappClick: vi.fn().mockResolvedValue(undefined),
    getMyStore: vi.fn().mockResolvedValue(null),
    saveMyStore: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn().mockResolvedValue(true),
    setProductInStock: vi.fn(),
    setMyTour: vi.fn(),
    getMyAnalytics: vi.fn().mockResolvedValue(emptyAnalytics()),
    listAllStores: vi.fn().mockResolvedValue([]),
    getSystemMetrics: vi.fn().mockResolvedValue(emptyMetrics()),
    setStoreActive: vi.fn(),
    getCallerUserRole: vi.fn().mockResolvedValue(UserRoleEnum.guest),
    isCallerAdmin: vi.fn().mockResolvedValue(false),
  };
  return { ...actor, ...overrides };
}

export function emptyAnalytics(): AnalyticsSummary {
  return { total_clicks: 0n, total_whatsapp_clicks: 0n, daily: [] };
}

export function emptyMetrics(): SystemMetrics {
  return { total_clicks: 0n, active_stores: 0n, paused_stores: 0n };
}

export function makeStore(overrides: Partial<Store> = {}): Store {
  return {
    store_id: "store-1",
    owner_id: {
      toText: () => "aaaaa-bbbbb-ccccc-ddddd-eeeee-fff",
    } as Store["owner_id"],
    store_name: "Greenfield Wholesale",
    whatsapp_number: "+15550102233",
    store_slug: "greenfield-wholesale",
    logo_url: undefined,
    is_active: true,
    status_notes: undefined,
    store_video_url: undefined,
    enable_video_tour: false,
    created_at: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeStorePublic(
  overrides: Partial<StorePublic> = {},
): StorePublic {
  const { owner_id: _owner, ...rest } = makeStore();
  return { ...rest, ...overrides };
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    product_id: "product-1",
    store_id: "store-1",
    product_name: "Classic Roasted Coffee Beans",
    price: 24.99,
    image_url: "https://example.test/coffee.png",
    category: "Beverages",
    in_stock: true,
    created_at: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeStoreAdminView(
  overrides: Partial<StoreAdminView> = {},
): StoreAdminView {
  return {
    store_id: "store-1",
    owner_id: {
      toText: () => "aaaaa-bbbbb-ccccc-ddddd-eeeee-fff",
    } as StoreAdminView["owner_id"],
    store_name: "Greenfield Wholesale",
    store_slug: "greenfield-wholesale",
    is_active: true,
    status_notes: undefined,
    created_at: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    principal: null,
    role: "anonymous",
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

export function makeAdminSession(overrides: Partial<Session> = {}): Session {
  return makeSession({
    principal: "admin-principal",
    role: UserRoleEnum.admin,
    isAuthenticated: true,
    isAdmin: true,
    ...overrides,
  });
}

export function makeOwnerSession(overrides: Partial<Session> = {}): Session {
  return makeSession({
    principal: "owner-principal",
    role: UserRoleEnum.user,
    isAuthenticated: true,
    isAdmin: false,
    ...overrides,
  });
}

export type { ReactNode };
