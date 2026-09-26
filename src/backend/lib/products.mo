import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/products";

module {
  public func listProducts(products : Map.Map<Types.ProductId, Types.Product>, storeId : Types.StoreId) : [Types.Product] {
    products.values().filter(func product = product.store_id == storeId).toArray();
  };

  public func getProduct(products : Map.Map<Types.ProductId, Types.Product>, productId : Types.ProductId) : ?Types.Product {
    products.get(productId);
  };

  public func createProduct(
    products : Map.Map<Types.ProductId, Types.Product>,
    storeId : Types.StoreId,
    input : Types.ProductInput,
  ) : Types.Product {
    let now = Time.now();
    let productId = storeId # "-p-" # now.toText();
    let product : Types.Product = {
      product_id = productId;
      store_id = storeId;
      product_name = input.product_name;
      price = input.price;
      image_url = input.image_url;
      category = input.category;
      in_stock = true;
      created_at = now;
    };
    products.add(productId, product);
    product;
  };

  public func updateProduct(
    products : Map.Map<Types.ProductId, Types.Product>,
    storeId : Types.StoreId,
    productId : Types.ProductId,
    input : Types.ProductInput,
  ) : Types.Product {
    let existing = products.get(productId)
      ?? Runtime.trap("Product not found");
    if (existing.store_id != storeId) {
      Runtime.trap("Not store owner");
    };
    let updated : Types.Product = {
      existing with
      product_name = input.product_name;
      price = input.price;
      image_url = input.image_url;
      category = input.category;
    };
    products.add(productId, updated);
    updated;
  };

  public func deleteProduct(
    products : Map.Map<Types.ProductId, Types.Product>,
    storeId : Types.StoreId,
    productId : Types.ProductId,
  ) : Bool {
    switch (products.get(productId)) {
      case (?existing) {
        if (existing.store_id != storeId) {
          Runtime.trap("Not store owner");
        };
        products.remove(productId);
        true;
      };
      case null { false };
    };
  };

  public func setInStock(
    products : Map.Map<Types.ProductId, Types.Product>,
    storeId : Types.StoreId,
    productId : Types.ProductId,
    inStock : Bool,
  ) : Types.Product {
    let existing = products.get(productId)
      ?? Runtime.trap("Product not found");
    if (existing.store_id != storeId) {
      Runtime.trap("Not store owner");
    };
    let updated : Types.Product = { existing with in_stock = inStock };
    products.add(productId, updated);
    updated;
  };
};
