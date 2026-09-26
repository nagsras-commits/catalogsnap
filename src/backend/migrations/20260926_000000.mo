import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Store = {
    store_id : Text;
    owner_id : Principal;
    store_name : Text;
    whatsapp_number : Text;
    store_slug : Text;
    logo_url : ?Text;
    is_active : Bool;
    status_notes : ?Text;
    store_video_url : ?Text;
    enable_video_tour : Bool;
    created_at : Int;
  };

  type Product = {
    product_id : Text;
    store_id : Text;
    product_name : Text;
    price : Float;
    image_url : Text;
    category : Text;
    in_stock : Bool;
    created_at : Int;
  };

  type Analytics = {
    analytics_id : Text;
    store_id : Text;
    click_count : Nat;
    whatsapp_clicks : Nat;
    date : Text;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    stores : Map.Map<Text, Store>;
    slugIndex : Map.Map<Text, Text>;
    products : Map.Map<Text, Product>;
    analytics : Map.Map<Text, Analytics>;
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      stores = Map.empty();
      slugIndex = Map.empty();
      products = Map.empty();
      analytics = Map.empty();
    };
  };
};
