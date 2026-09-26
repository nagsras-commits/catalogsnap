import Common "common";

module {
  public type ProductId = Common.ProductId;
  public type StoreId = Common.StoreId;
  public type Timestamp = Common.Timestamp;

  public type Product = {
    product_id : ProductId;
    store_id : StoreId;
    product_name : Text;
    price : Float;
    image_url : Text;
    category : Text;
    in_stock : Bool;
    created_at : Timestamp;
  };

  public type ProductInput = {
    product_name : Text;
    price : Float;
    image_url : Text;
    category : Text;
  };

  public type ProductError = {
    #productNotFound : ProductId;
    #notStoreOwner;
    #storeNotFound : StoreId;
  };
};
