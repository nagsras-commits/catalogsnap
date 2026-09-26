import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Analytics {
    whatsapp_clicks: bigint;
    click_count: bigint;
    date: DateKey;
    analytics_id: AnalyticsId;
    store_id: StoreId;
}
export type AnalyticsId = string;
export interface AnalyticsSummary {
    total_clicks: bigint;
    total_whatsapp_clicks: bigint;
    daily: Array<Analytics>;
}
export interface Cell {
    value: Value;
    name: string;
}
export type DateKey = string;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Product {
    product_id: ProductId;
    image_url: string;
    created_at: Timestamp;
    product_name: string;
    category: string;
    price: number;
    store_id: StoreId;
    in_stock: boolean;
}
export type ProductId = string;
export interface ProductInput {
    image_url: string;
    product_name: string;
    category: string;
    price: number;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Store {
    store_video_url?: string;
    created_at: Timestamp;
    logo_url?: string;
    owner_id: Principal;
    store_name: string;
    store_slug: string;
    whatsapp_number: string;
    enable_video_tour: boolean;
    is_active: boolean;
    status_notes?: string;
    store_id: StoreId;
}
export interface StoreAdminView {
    created_at: Timestamp;
    owner_id: Principal;
    store_name: string;
    store_slug: string;
    is_active: boolean;
    status_notes?: string;
    store_id: StoreId;
}
export type StoreId = string;
export interface StoreInput {
    logo_url?: string;
    store_name: string;
    store_slug: string;
    whatsapp_number: string;
}
export interface StorePublic {
    store_video_url?: string;
    created_at: Timestamp;
    logo_url?: string;
    store_name: string;
    store_slug: string;
    whatsapp_number: string;
    enable_video_tour: boolean;
    is_active: boolean;
    status_notes?: string;
    store_id: StoreId;
}
export interface SystemMetrics {
    total_clicks: bigint;
    active_stores: bigint;
    paused_stores: bigint;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProduct(input: ProductInput): Promise<Product>;
    deleteProduct(productId: ProductId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getMyAnalytics(): Promise<AnalyticsSummary>;
    getMyStore(): Promise<Store | null>;
    getPublicProducts(slug: string): Promise<Array<Product>>;
    getPublicStore(slug: string): Promise<StorePublic | null>;
    getSystemMetrics(): Promise<SystemMetrics>;
    isCallerAdmin(): Promise<boolean>;
    listAllStores(): Promise<Array<StoreAdminView>>;
    recordStoreVisit(slug: string): Promise<void>;
    recordWhatsappClick(slug: string): Promise<void>;
    saveMyStore(input: StoreInput): Promise<Store>;
    schema(): Promise<string>;
    setMyTour(videoUrl: string | null, enabled: boolean): Promise<Store>;
    setProductInStock(productId: ProductId, inStock: boolean): Promise<Product>;
    setStoreActive(storeId: StoreId, active: boolean, note: string | null): Promise<StoreAdminView>;
    updateProduct(productId: ProductId, input: ProductInput): Promise<Product>;
}
