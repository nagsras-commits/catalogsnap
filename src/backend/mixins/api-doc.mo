mixin () {
  public query func getApiDoc() : async Text {
    "# CatalogSnap Backend API\n" #
    "\n" #
    "CatalogSnap is a multi-tenant storefront backend for wholesale traders and shop\n" #
    "owners. Each store owner manages a catalog of products and shares a public,\n" #
    "login-free storefront link. A platform admin can pause or resume any store.\n" #
    "The canister also exposes its persisted data to the Caffeine Data Intelligence\n" #
    "agent through the OQL `schema()` / `execute()` endpoints.\n" #
    "\n" #
    "## Authentication and identity\n" #
    "\n" #
    "The app uses Internet Identity. The frontend pins an Internet Identity\n" #
    "derivation origin, published at `/.well-known/ii-derivation-origin` when\n" #
    "available, so an agent already holding the user's Internet Identity\n" #
    "authorization derives the correct per-app principal against that origin (for\n" #
    "example `icp identity link web <name> --app <host>`). Such a delegation acts\n" #
    "with the user's full authority in this app until it expires.\n" #
    "\n" #
    "Registration is a prerequisite for every role-guarded call. A caller registers\n" #
    "by calling `_initialize_access_control` once while signed in (non-anonymous).\n" #
    "The first principal to register becomes `#admin`; every later principal becomes\n" #
    "`#user`. A principal that never signed in through the app's own frontend is\n" #
    "unregistered even when it belongs to the app's owner, and a signed-in caller\n" #
    "derived against a different origin is a different principal than the one the\n" #
    "frontend registered.\n" #
    "\n" #
    "Role-guarded endpoints trap for an unregistered caller. `getUserRole` traps with\n" #
    "`User is not registered`; the merchant endpoints trap with\n" #
    "`Unauthorized: Only users can perform this action`; the admin endpoints trap\n" #
    "with `Unauthorized: Only admins can perform this action`. Anonymous callers are\n" #
    "treated as `#guest` and fail every role check. The public storefront endpoints\n" #
    "and `getApiDoc` require no registration at all.\n" #
    "\n" #
    "## Public storefront (no login required)\n" #
    "\n" #
    "- `getPublicStore(slug : Text) : async ?StorePublic` — query. Returns the public\n" #
    "  view of the store with the given slug, or `null` when no store has that slug.\n" #
    "  The public view omits `owner_id`. When `is_active` is `false` the store is\n" #
    "  paused and the frontend shows a paused banner.\n" #
    "- `getPublicProducts(slug : Text) : async [Product]` — query. Returns every\n" #
    "  product of the store with the given slug, or `[]` when the slug is unknown.\n" #
    "  Products are returned in map iteration order, not sorted.\n" #
    "- `recordStoreVisit(slug : Text) : async ()` — update. Increments the store's\n" #
    "  click counter for the current UTC day. Unknown slugs are silently ignored.\n" #
    "- `recordWhatsappClick(slug : Text) : async ()` — update. Increments the store's\n" #
    "  WhatsApp-click counter for the current UTC day. Unknown slugs are silently\n" #
    "  ignored.\n" #
    "\n" #
    "## Merchant dashboard (signed-in `#user` or `#admin`)\n" #
    "\n" #
    "- `saveMyStore(input : StoreInput) : async Store` — update. Creates the caller's\n" #
    "  store on first call, otherwise updates it. `StoreInput` is\n" #
    "  `{ store_name : Text; whatsapp_number : Text; store_slug : Text; logo_url : ?Text }`.\n" #
    "  The slug is\n" #
    "  trimmed of spaces and lowercased before storage. Traps with `Invalid slug`\n" #
    "  when the normalized slug is empty, and with `Slug already taken` when another\n" #
    "  store already owns it.\n" #
    "- `getMyStore() : async ?Store` — query. Returns the caller's store, or `null`\n" #
    "  when the caller is not a registered user or has no store yet.\n" #
    "- `createProduct(input : ProductInput) : async Product` — update. Adds a product\n" #
    "  to the caller's store. `ProductInput` is\n" #
    "  `{ product_name : Text; price : Float; image_url : Text; category : Text }`.\n" #
    "  New products start `in_stock = true`. Traps with `Store not found` when the\n" #
    "  caller has no store.\n" #
    "- `updateProduct(productId : ProductId, input : ProductInput) : async Product` —\n" #
    "  update. Replaces the editable fields of one of the caller's products. Traps\n" #
    "  with `Product not found` or `Not store owner`.\n" #
    "- `deleteProduct(productId : ProductId) : async Bool` — update. Removes one of\n" #
    "  the caller's products and returns `true`, or returns `false` when no product\n" #
    "  has that id. Traps with `Not store owner` when the product belongs to another\n" #
    "  store.\n" #
    "- `setProductInStock(productId : ProductId, inStock : Bool) : async Product` —\n" #
    "  update. Sets the stock flag of one of the caller's products. Traps with\n" #
    "  `Product not found` or `Not store owner`.\n" #
    "- `setMyTour(videoUrl : ?Text, enabled : Bool) : async Store` — update. Sets the\n" #
    "  caller's store tour video URL and whether the tour is enabled. Traps with\n" #
    "  `Store not found` when the caller has no store.\n" #
    "- `getMyAnalytics() : async AnalyticsSummary` — query. Returns the caller's\n" #
    "  store totals and per-day rows. `daily` is sorted ascending by date key\n" #
    "  (oldest first). Returns zeroed totals and an empty `daily`\n" #
    "  array when the caller is not a registered user or has no store.\n" #
    "\n" #
    "## Admin dashboard (signed-in `#admin`)\n" #
    "\n" #
    "- `listAllStores() : async [StoreAdminView]` — query. Returns every store with\n" #
    "  its owner principal and pause state. Traps for non-admins.\n" #
    "- `getSystemMetrics() : async SystemMetrics` — query. Returns\n" #
    "  `{ active_stores; paused_stores; total_clicks }`. `total_clicks` sums the\n" #
    "  click counter across all stores. Traps for non-admins.\n" #
    "- `setStoreActive(storeId : StoreId, active : Bool, note : ?Text) : async StoreAdminView`\n" #
    "  — update. Pauses (`active = false`) or resumes (`active = true`) a store and\n" #
    "  stores the optional note as `status_notes`. Traps with `Store not found` for\n" #
    "  an unknown id, and for non-admins.\n" #
    "\n" #
    "## Access-control endpoints\n" #
    "\n" #
    "- `_initialize_access_control() : async ()` — update. Registers the caller; the\n" #
    "  first caller becomes `#admin`, later callers become `#user`. Anonymous callers\n" #
    "  are ignored.\n" #
    "- `_internet_identity_sign_in_start() : async Blob` and\n" #
    "  `_internet_identity_sign_in_finish() : async Result<(), Verify.Error>` —\n" #
    "  Internet Identity sign-in handshake used by the frontend.\n" #
    "- `getCallerUserRole() : async UserRole` — query. Returns `#admin`, `#user`, or\n" #
    "  `#guest` (anonymous). Traps with `User is not registered` for a signed-in but\n" #
    "  unregistered caller.\n" #
    "- `isCallerAdmin() : async Bool` — query. Whether the caller is an admin.\n" #
    "- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` — update.\n" #
    "  Admin-only; traps with `Unauthorized: Only admins can assign user roles`.\n" #
    "\n" #
    "## Data intelligence (OQL)\n" #
    "\n" #
    "- `schema() : async Text` — query. Returns the OQL schema of the exposed\n" #
    "  entities.\n" #
    "- `execute(query : Text) : async Text` — query. Runs a JSON OQL query against\n" #
    "  the exposed entities.\n" #
    "\n" #
    "Exposed entities and their authorization:\n" #
    "\n" #
    "- `store` — public. All store rows, including paused stores.\n" #
    "- `product` — public. All product rows.\n" #
    "- `analytics` — controller-only. Daily click rows are private to users and\n" #
    "  readable only by the platform controller.\n" #
    "\n" #
    "## Units and encoding\n" #
    "\n" #
    "- `Timestamp` (`created_at`) is an `Int` of nanoseconds since the Unix epoch\n" #
    "  (`Time.now()`).\n" #
    "- `DateKey` (`analytics.date`) is a `Text` day bucket computed as\n" #
    "  `floor(now_ns / 1_000_000_000 / 86_400)` — the number of whole UTC days since\n" #
    "  the epoch, as a decimal string. It is not an ISO date.\n" #
    "- `StoreId`, `ProductId`, and `AnalyticsId` are `Text`. Store ids are\n" #
    "  `<owner-principal>-<created_at-ns>`; product ids are\n" #
    "  `<store_id>-p-<created_at-ns>`; analytics ids are `<store_id>:<date>`.\n" #
    "- `price` is a `Float`.\n" #
    "- Optional fields (`logo_url`, `status_notes`, `store_video_url`) are `?Text`;\n" #
    "  `null` means unset. In the OQL `store` entity `status_notes` and\n" #
    "  `store_video_url` are projected as empty strings.\n" #
    "\n" #
    "## Lifecycle, polling, and retry safety\n" #
    "\n" #
    "- `getPublicStore` and `getPublicProducts` are queries and reflect the latest\n" #
    "  committed state; there is no cache to invalidate.\n" #
    "- `recordStoreVisit` and `recordWhatsappClick` are updates and are **not**\n" #
    "  idempotent — each call increments a counter. Call them once per user action;\n" #
    "  retrying a call double-counts.\n" #
    "- `saveMyStore` is idempotent for a given input: it creates the store on the\n" #
    "  first call and updates it afterwards, so a retry does not create duplicates.\n" #
    "- `createProduct` is **not** idempotent — each call appends a new product with a\n" #
    "  fresh id. Retrying creates a duplicate product.\n" #
    "- `updateProduct`, `setProductInStock`, `setMyTour`, and `setStoreActive` are\n" #
    "  idempotent: repeating them with the same arguments leaves the same state.\n" #
    "- `deleteProduct` is idempotent in effect: the first call removes the product\n" #
    "  and returns `true`; a repeat returns `false` and changes nothing.\n" #
    "- Pausing a store (`setStoreActive(id, false, note)`) immediately blocks the\n" #
    "  owner's merchant dashboard and marks the public catalog paused; resuming\n" #
    "  restores both. The public catalog data is never deleted by pausing.\n" #
    "\n" #
    "## Errors and gotchas\n" #
    "\n" #
    "- Role-guarded endpoints trap rather than returning an error variant. A trap\n" #
    "  rolls back the whole message and reaches the frontend as an opaque reject.\n" #
    "- `getMyStore` and `getMyAnalytics` return empty/`null` results instead of\n" #
    "  trapping for unregistered or store-less callers, so the frontend can render a\n" #
    "  signed-out or onboarding state without catching an error.\n" #
    "- Slug uniqueness is enforced across all stores; changing a store's slug frees\n" #
    "  the old one.\n" #
    "- The public storefront endpoints never require a login, so a paused store's\n" #
    "  catalog is still readable — the frontend is responsible for showing the paused\n" #
    "  banner when `is_active` is `false`.\n";
  };
};
