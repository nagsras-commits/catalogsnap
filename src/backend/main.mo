import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";
import StoreTypes "types/stores";
import ProductTypes "types/products";
import AnalyticsTypes "types/analytics";
import StorefrontApi "mixins/storefront-api";
import MerchantApi "mixins/merchant-api";
import AdminApi "mixins/admin-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;

  let stores : Map.Map<StoreTypes.StoreId, StoreTypes.Store>;
  let slugIndex : Map.Map<Text, StoreTypes.StoreId>;
  let products : Map.Map<ProductTypes.ProductId, ProductTypes.Product>;
  let analytics : Map.Map<AnalyticsTypes.AnalyticsId, AnalyticsTypes.Analytics>;

  include MixinAuthorization(accessControlState, null);
  include StorefrontApi(stores, products, analytics);
  include MerchantApi(accessControlState, stores, slugIndex, products, analytics);
  include AdminApi(accessControlState, stores, analytics);
  include ApiDocMixin();
  include Expose({
    entities = [
      stores.toEntityManual("store", "Store", "store_id")
        .sample({
          store_id = "";
          owner_id = Principal.fromText("aaaaa-aa");
          store_name = "";
          whatsapp_number = "";
          store_slug = "";
          logo_url = null;
          is_active = true;
          status_notes = null;
          store_video_url = null;
          enable_video_tour = false;
          created_at = 0;
        })
        .payload("store_id", func s = s.store_id)
        .payload("store_name", func s = s.store_name)
        .payload("whatsapp_number", func s = s.whatsapp_number)
        .payload("store_slug", func s = s.store_slug)
        .payload("is_active", func s = s.is_active)
        .payload("status_notes", func s = s.status_notes ?? "")
        .payload("store_video_url", func s = s.store_video_url ?? "")
        .payload("enable_video_tour", func s = s.enable_video_tour)
        .payload("created_at", func s = s.created_at)
        .public_()
        .build(),
      products.toEntity("product", "Product", "product_id")
        .sample({
          product_id = "";
          store_id = "";
          product_name = "";
          price = 0.0;
          image_url = "";
          category = "";
          in_stock = true;
          created_at = 0;
        })
        .public_()
        .build(),
      analytics.toEntity("analytics", "Analytics", "analytics_id")
        .sample({
          analytics_id = "";
          store_id = "";
          click_count = 0;
          whatsapp_clicks = 0;
          date = "";
        })
        .controllerOnly()
        .build(),
    ];
  });
};
