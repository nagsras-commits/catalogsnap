import { PauseCircle } from "lucide-react";

/**
 * Storefront paused notice. Shown while the store identity and catalog stay
 * fully visible — only ordering is discouraged.
 */
export function PausedBanner({ note }: { note?: string }) {
  return (
    <output
      data-ocid="storefront.paused_banner"
      className="flex items-start gap-3 border-b border-warning/40 bg-warning/15 px-4 py-3"
    >
      <PauseCircle
        className="mt-0.5 size-5 shrink-0 text-warning-foreground"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-warning-foreground">
          This store is currently paused. Please check back later.
        </p>
        {note && (
          <p className="mt-0.5 text-xs text-warning-foreground/80">{note}</p>
        )}
      </div>
    </output>
  );
}
