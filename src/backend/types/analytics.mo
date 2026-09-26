import Common "common";

module {
  public type AnalyticsId = Common.AnalyticsId;
  public type StoreId = Common.StoreId;
  public type DateKey = Common.DateKey;

  public type Analytics = {
    analytics_id : AnalyticsId;
    store_id : StoreId;
    click_count : Nat;
    whatsapp_clicks : Nat;
    date : DateKey;
  };

  public type AnalyticsSummary = {
    total_clicks : Nat;
    total_whatsapp_clicks : Nat;
    daily : [Analytics];
  };
};
