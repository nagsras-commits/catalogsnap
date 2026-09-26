import Common "common";

module {
  public type StoreId = Common.StoreId;
  public type Timestamp = Common.Timestamp;

  public type Store = {
    store_id : StoreId;
    owner_id : Principal;
    store_name : Text;
    whatsapp_number : Text;
    store_slug : Text;
    logo_url : ?Text;
    is_active : Bool;
    status_notes : ?Text;
    store_video_url : ?Text;
    enable_video_tour : Bool;
    created_at : Timestamp;
  };

  public type StoreInput = {
    store_name : Text;
    whatsapp_number : Text;
    store_slug : Text;
    logo_url : ?Text;
  };

  public type StorePublic = {
    store_id : StoreId;
    store_name : Text;
    whatsapp_number : Text;
    store_slug : Text;
    logo_url : ?Text;
    is_active : Bool;
    status_notes : ?Text;
    store_video_url : ?Text;
    enable_video_tour : Bool;
    created_at : Timestamp;
  };

  public type StoreAdminView = {
    store_id : StoreId;
    owner_id : Principal;
    store_name : Text;
    store_slug : Text;
    is_active : Bool;
    status_notes : ?Text;
    created_at : Timestamp;
  };

  public type SystemMetrics = {
    active_stores : Nat;
    paused_stores : Nat;
    total_clicks : Nat;
  };

  public type StoreError = {
    #slugTaken : Text;
    #storeNotFound : StoreId;
    #notStoreOwner;
    #invalidSlug : Text;
  };
};
