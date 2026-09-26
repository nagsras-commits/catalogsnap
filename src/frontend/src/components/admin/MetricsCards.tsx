import type { SystemMetrics } from "@/backend";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount } from "@/lib/format";
import { Activity, MousePointerClick, PauseCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricsCardsProps {
  metrics: SystemMetrics | undefined;
  isLoading: boolean;
}

interface MetricSpec {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  value: string;
  tone: "live" | "paused" | "neutral";
}

const TONE_CLASSES: Record<MetricSpec["tone"], string> = {
  live: "bg-accent/25 text-accent-foreground",
  paused: "bg-warning/25 text-warning-foreground",
  neutral: "bg-secondary text-secondary-foreground",
};

/**
 * Overview metrics for the admin panel: active stores, paused stores, and the
 * total system click count. Renders layout-matched skeletons while loading.
 */
export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  const specs: MetricSpec[] = [
    {
      id: "active",
      label: "Active stores",
      hint: "Live and accepting orders",
      icon: Activity,
      value: metrics ? formatCount(metrics.active_stores) : "—",
      tone: "live",
    },
    {
      id: "paused",
      label: "Paused stores",
      hint: "Hidden from buyers",
      icon: PauseCircle,
      value: metrics ? formatCount(metrics.paused_stores) : "—",
      tone: "paused",
    },
    {
      id: "clicks",
      label: "System clicks",
      hint: "All-time catalog visits",
      icon: MousePointerClick,
      value: metrics ? formatCount(metrics.total_clicks) : "—",
      tone: "neutral",
    },
  ];

  return (
    <section
      data-ocid="admin.metrics_section"
      aria-label="System overview"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      {specs.map((spec) => {
        const Icon = spec.icon;
        return (
          <div
            key={spec.id}
            data-ocid={`admin.metric_card.${spec.id}`}
            className="rounded-2xl border border-border bg-card p-4 shadow-subtle"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {spec.label}
              </p>
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${TONE_CLASSES[spec.tone]}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>

            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {spec.value}
              </p>
            )}

            <p className="mt-1 text-xs text-muted-foreground">{spec.hint}</p>
          </div>
        );
      })}
    </section>
  );
}
