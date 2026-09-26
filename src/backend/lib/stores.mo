import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/stores";

module {
  public func getStoreBySlug(stores : Map.Map<Types.StoreId, Types.Store>, slug : Text) : ?Types.Store {
    stores.values().find(func store = store.store_slug == slug);
  };

  public func getStoreByOwner(stores : Map.Map<Types.StoreId, Types.Store>, owner : Principal) : ?Types.Store {
    stores.values().find(func store = store.owner_id == owner);
  };

  public func getStoreById(stores : Map.Map<Types.StoreId, Types.Store>, storeId : Types.StoreId) : ?Types.Store {
    stores.get(storeId);
  };

  public func createStore(
    stores : Map.Map<Types.StoreId, Types.Store>,
    slugIndex : Map.Map<Text, Types.StoreId>,
    owner : Principal,
    input : Types.StoreInput,
  ) : Types.Store {
    let slug = normalizeSlug(input.store_slug);
    if (slug.size() == 0) {
      Runtime.trap("Invalid slug");
    };
    switch (slugIndex.get(slug)) {
      case (?_) { Runtime.trap("Slug already taken") };
      case null {};
    };
    let now = Time.now();
    let storeId = owner.toText() # "-" # now.toText();
    let store : Types.Store = {
      store_id = storeId;
      owner_id = owner;
      store_name = input.store_name;
      whatsapp_number = input.whatsapp_number;
      store_slug = slug;
      logo_url = input.logo_url;
      is_active = true;
      status_notes = null;
      store_video_url = null;
      enable_video_tour = false;
      created_at = now;
    };
    stores.add(storeId, store);
    slugIndex.add(slug, storeId);
    store;
  };

  public func updateStore(
    stores : Map.Map<Types.StoreId, Types.Store>,
    slugIndex : Map.Map<Text, Types.StoreId>,
    owner : Principal,
    input : Types.StoreInput,
  ) : Types.Store {
    let existing = getStoreByOwner(stores, owner)
      ?? Runtime.trap("Store not found");
    let slug = normalizeSlug(input.store_slug);
    if (slug.size() == 0) {
      Runtime.trap("Invalid slug");
    };
    switch (slugIndex.get(slug)) {
      case (?otherId) {
        if (otherId != existing.store_id) {
          Runtime.trap("Slug already taken");
        };
      };
      case null {};
    };
    if (slug != existing.store_slug) {
      slugIndex.remove(existing.store_slug);
      slugIndex.add(slug, existing.store_id);
    };
    let updated : Types.Store = {
      existing with
      store_name = input.store_name;
      whatsapp_number = input.whatsapp_number;
      store_slug = slug;
      logo_url = input.logo_url;
    };
    stores.add(existing.store_id, updated);
    updated;
  };

  public func setTour(
    stores : Map.Map<Types.StoreId, Types.Store>,
    owner : Principal,
    videoUrl : ?Text,
    enabled : Bool,
  ) : Types.Store {
    let existing = getStoreByOwner(stores, owner)
      ?? Runtime.trap("Store not found");
    let updated : Types.Store = {
      existing with
      store_video_url = videoUrl;
      enable_video_tour = enabled;
    };
    stores.add(existing.store_id, updated);
    updated;
  };

  public func setActive(
    stores : Map.Map<Types.StoreId, Types.Store>,
    storeId : Types.StoreId,
    active : Bool,
    note : ?Text,
  ) : Types.Store {
    let existing = stores.get(storeId)
      ?? Runtime.trap("Store not found");
    let updated : Types.Store = {
      existing with
      is_active = active;
      status_notes = note;
    };
    stores.add(storeId, updated);
    updated;
  };

  public func listStores(stores : Map.Map<Types.StoreId, Types.Store>) : [Types.Store] {
    stores.values().toArray();
  };

  public func toPublic(store : Types.Store) : Types.StorePublic {
    {
      store_id = store.store_id;
      store_name = store.store_name;
      whatsapp_number = store.whatsapp_number;
      store_slug = store.store_slug;
      logo_url = store.logo_url;
      is_active = store.is_active;
      status_notes = store.status_notes;
      store_video_url = store.store_video_url;
      enable_video_tour = store.enable_video_tour;
      created_at = store.created_at;
    };
  };

  public func toAdminView(store : Types.Store) : Types.StoreAdminView {
    {
      store_id = store.store_id;
      owner_id = store.owner_id;
      store_name = store.store_name;
      store_slug = store.store_slug;
      is_active = store.is_active;
      status_notes = store.status_notes;
      created_at = store.created_at;
    };
  };

  func normalizeSlug(slug : Text) : Text {
    slug.trim(#predicate(func c = c == ' ')).toLower();
  };
};
