import type { AnalyticsSummary } from "@/backend";
import { formatCount } from "@/lib/format";
import {
  BarChart3,
  MessageCircle,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";

interface StoreAnalyticsProps {
  summary: AnalyticsSummary | null | undefined;
  isLoading: boolean;
}

/**
 * Store performance summary: total storefront clicks and WhatsApp order
 * clicks, plus a compact per-day bar strip for the most recent days.
 */
export function StoreAnalytics({ summary, isLoading }: StoreAnalyticsProps) {
  const totalClicks = summary?.total_clicks ?? 0n;
  const totalWhatsapp = summary?.total_whatsapp_clicks ?? 0n;
  const daily = summary?.daily ?? [];

  const conversion =
    totalClicks > 0n
      ? Math.round((Number(totalWhatsapp) / Number(totalClicks)) * 100)
      : 0;

  const recent = daily.slice(-7);
  const maxDaily = recent.reduce(
    (max, day) => Math.max(max, Number(day.click_count)),
    0,
  );

  const metrics = [
    {
      key: "clicks",
      label: "Storefront clicks",
      value: formatCount(totalClicks),
      icon: MousePointerClick,
    },
    {
      key: "whatsapp",
      label: "WhatsApp orders",
      value: formatCount(totalWhatsapp),
      icon: MessageCircle,
    },
    {
      key: "conversion",
      label: "Click → order",
      value: `${conversion}%`,
      icon: TrendingUp,
    },
  ] as const;

  return (
    <section
      data-ocid="dashboard.analytics_section"
      className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
    >
      <header className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <BarChart3 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Store performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Clicks and WhatsApp orders across your storefront.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div
          data-ocid="dashboard.analytics_loading_state"
          className="mt-5 grid grid-cols-3 gap-3"
        >
          {["clicks", "whatsapp", "conversion"].map((id) => (
            <div
              key={id}
              className="h-[74px] animate-pulse rounded-xl border border-border bg-muted/50"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.key}
                data-ocid={`dashboard.metric.${metric.key}`}
                className="rounded-xl border border-border bg-muted/40 p-3"
              >
                <metric.icon
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-1.5 font-display text-xl font-bold tracking-tight text-foreground">
                  {metric.value}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {recent.length > 0 ? (
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Last {recent.length} day{recent.length === 1 ? "" : "s"}
              </p>
              <div
                data-ocid="dashboard.analytics_chart"
                className="mt-2 flex h-24 items-end gap-1.5"
              >
                {recent.map((day) => {
                  const clicks = Number(day.click_count);
                  const height =
                    maxDaily > 0 ? Math.max(6, (clicks / maxDaily) * 100) : 6;
                  return (
                    <div
                      key={day.date}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1"
                      title={`${day.date}: ${clicks} clicks`}
                    >
                      <div className="flex h-20 w-full items-end">
                        <div
                          className="w-full rounded-t-md bg-primary/80 transition-smooth"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="w-full truncate text-center font-mono text-[9px] text-muted-foreground">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p
              data-ocid="dashboard.analytics_empty_state"
              className="mt-5 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground"
            >
              No traffic yet. Share your store link to start collecting clicks.
            </p>
          )}
        </>
      )}
    </section>
  );
}
