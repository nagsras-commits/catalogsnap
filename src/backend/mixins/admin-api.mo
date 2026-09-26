import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import StoreTypes "../types/stores";
import AnalyticsTypes "../types/analytics";
import StoreLib "../lib/stores";
import AnalyticsLib "../lib/analytics";

mixin (
  accessControlState : AccessControl.AccessControlState,
  stores : Map.Map<StoreTypes.StoreId, StoreTypes.Store>,
  analytics : Map.Map<AnalyticsTypes.AnalyticsId, AnalyticsTypes.Analytics>,
) {
  func requireAdmin(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query ({ caller }) func listAllStores() : async [StoreTypes.StoreAdminView] {
    requireAdmin(caller);
    StoreLib.listStores(stores).map(func store = StoreLib.toAdminView(store));
  };

  public query ({ caller }) func getSystemMetrics() : async StoreTypes.SystemMetrics {
    requireAdmin(caller);
    let all = StoreLib.listStores(stores);
    var active = 0;
    var paused = 0;
    for (store in all.values()) {
      if (store.is_active) { active += 1 } else { paused += 1 };
    };
    {
      active_stores = active;
      paused_stores = paused;
      total_clicks = AnalyticsLib.totalClicks(analytics);
    };
  };

  public shared ({ caller }) func setStoreActive(storeId : StoreTypes.StoreId, active : Bool, note : ?Text) : async StoreTypes.StoreAdminView {
    requireAdmin(caller);
    StoreLib.toAdminView(StoreLib.setActive(stores, storeId, active, note));
  };
};
