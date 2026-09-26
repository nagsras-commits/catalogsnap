import Map "mo:core/Map";
import Int "mo:core/Int";
import Time "mo:core/Time";
import StoreTypes "../types/stores";
import ProductTypes "../types/products";
import AnalyticsTypes "../types/analytics";
import StoreLib "../lib/stores";
import ProductLib "../lib/products";
import AnalyticsLib "../lib/analytics";

mixin (
  stores : Map.Map<StoreTypes.StoreId, StoreTypes.Store>,
  products : Map.Map<ProductTypes.ProductId, ProductTypes.Product>,
  analytics : Map.Map<AnalyticsTypes.AnalyticsId, AnalyticsTypes.Analytics>,
) {
  func todayKey() : Text {
    let seconds = Time.now() / 1_000_000_000;
    let days = seconds / 86_400;
    days.toText();
  };

  public query func getPublicStore(slug : Text) : async ?StoreTypes.StorePublic {
    switch (StoreLib.getStoreBySlug(stores, slug)) {
      case (?store) { ?StoreLib.toPublic(store) };
      case null { null };
    };
  };

  public query func getPublicProducts(slug : Text) : async [ProductTypes.Product] {
    switch (StoreLib.getStoreBySlug(stores, slug)) {
      case (?store) { ProductLib.listProducts(products, store.store_id) };
      case null { [] };
    };
  };

  public shared func recordStoreVisit(slug : Text) : async () {
    switch (StoreLib.getStoreBySlug(stores, slug)) {
      case (?store) {
        ignore AnalyticsLib.recordVisit(analytics, store.store_id, todayKey());
      };
      case null {};
    };
  };

  public shared func recordWhatsappClick(slug : Text) : async () {
    switch (StoreLib.getStoreBySlug(stores, slug)) {
      case (?store) {
        ignore AnalyticsLib.recordWhatsappClick(analytics, store.store_id, todayKey());
      };
      case null {};
    };
  };
};
