import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Types "../types/analytics";

module {
  func keyFor(storeId : Types.StoreId, date : Types.DateKey) : Types.AnalyticsId {
    storeId # ":" # date;
  };

  public func recordVisit(
    analytics : Map.Map<Types.AnalyticsId, Types.Analytics>,
    storeId : Types.StoreId,
    date : Types.DateKey,
  ) : Types.Analytics {
    let id = keyFor(storeId, date);
    let existing = analytics.get(id);
    let updated : Types.Analytics = switch (existing) {
      case (?row) { { row with click_count = row.click_count + 1 } };
      case null {
        {
          analytics_id = id;
          store_id = storeId;
          click_count = 1;
          whatsapp_clicks = 0;
          date = date;
        };
      };
    };
    analytics.add(id, updated);
    updated;
  };

  public func recordWhatsappClick(
    analytics : Map.Map<Types.AnalyticsId, Types.Analytics>,
    storeId : Types.StoreId,
    date : Types.DateKey,
  ) : Types.Analytics {
    let id = keyFor(storeId, date);
    let existing = analytics.get(id);
    let updated : Types.Analytics = switch (existing) {
      case (?row) { { row with whatsapp_clicks = row.whatsapp_clicks + 1 } };
      case null {
        {
          analytics_id = id;
          store_id = storeId;
          click_count = 0;
          whatsapp_clicks = 1;
          date = date;
        };
      };
    };
    analytics.add(id, updated);
    updated;
  };

  public func summaryForStore(
    analytics : Map.Map<Types.AnalyticsId, Types.Analytics>,
    storeId : Types.StoreId,
  ) : Types.AnalyticsSummary {
    let daily = analytics.values()
      .filter(func row = row.store_id == storeId)
      .toArray()
      .sort(func (a, b) = Int.compare(a.date.toInt() ?? 0, b.date.toInt() ?? 0));
    var totalClicks = 0;
    var totalWhatsapp = 0;
    for (row in daily.values()) {
      totalClicks += row.click_count;
      totalWhatsapp += row.whatsapp_clicks;
    };
    {
      total_clicks = totalClicks;
      total_whatsapp_clicks = totalWhatsapp;
      daily = daily;
    };
  };

  public func totalClicks(analytics : Map.Map<Types.AnalyticsId, Types.Analytics>) : Nat {
    analytics.values().foldLeft(0, func(acc, row) = acc + row.click_count);
  };
};
