import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import StoreTypes "../types/stores";
import ProductTypes "../types/products";
import AnalyticsTypes "../types/analytics";
import StoreLib "../lib/stores";
import ProductLib "../lib/products";
import AnalyticsLib "../lib/analytics";

mixin (
  accessControlState : AccessControl.AccessControlState,
  stores : Map.Map<StoreTypes.StoreId, StoreTypes.Store>,
  slugIndex : Map.Map<Text, StoreTypes.StoreId>,
  products : Map.Map<ProductTypes.ProductId, ProductTypes.Product>,
  analytics : Map.Map<AnalyticsTypes.AnalyticsId, AnalyticsTypes.Analytics>,
) {
  func requireUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  func requireOwnStore(caller : Principal) : StoreTypes.Store {
    requireUser(caller);
    StoreLib.getStoreByOwner(stores, caller)
      ?? Runtime.trap("Store not found");
  };

  public shared ({ caller }) func saveMyStore(input : StoreTypes.StoreInput) : async StoreTypes.Store {
    requireUser(caller);
    switch (StoreLib.getStoreByOwner(stores, caller)) {
      case (?_) { StoreLib.updateStore(stores, slugIndex, caller, input) };
      case null { StoreLib.createStore(stores, slugIndex, caller, input) };
    };
  };

  public query ({ caller }) func getMyStore() : async ?StoreTypes.Store {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return null;
    };
    StoreLib.getStoreByOwner(stores, caller);
  };

  public shared ({ caller }) func createProduct(input : ProductTypes.ProductInput) : async ProductTypes.Product {
    let store = requireOwnStore(caller);
    ProductLib.createProduct(products, store.store_id, input);
  };

  public shared ({ caller }) func updateProduct(productId : ProductTypes.ProductId, input : ProductTypes.ProductInput) : async ProductTypes.Product {
    let store = requireOwnStore(caller);
    ProductLib.updateProduct(products, store.store_id, productId, input);
  };

  public shared ({ caller }) func deleteProduct(productId : ProductTypes.ProductId) : async Bool {
    let store = requireOwnStore(caller);
    ProductLib.deleteProduct(products, store.store_id, productId);
  };

  public shared ({ caller }) func setProductInStock(productId : ProductTypes.ProductId, inStock : Bool) : async ProductTypes.Product {
    let store = requireOwnStore(caller);
    ProductLib.setInStock(products, store.store_id, productId, inStock);
  };

  public shared ({ caller }) func setMyTour(videoUrl : ?Text, enabled : Bool) : async StoreTypes.Store {
    requireUser(caller);
    StoreLib.setTour(stores, caller, videoUrl, enabled);
  };

  public query ({ caller }) func getMyAnalytics() : async AnalyticsTypes.AnalyticsSummary {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      return { total_clicks = 0; total_whatsapp_clicks = 0; daily = [] };
    };
    switch (StoreLib.getStoreByOwner(stores, caller)) {
      case (?store) { AnalyticsLib.summaryForStore(analytics, store.store_id) };
      case null { { total_clicks = 0; total_whatsapp_clicks = 0; daily = [] } };
    };
  };
};
