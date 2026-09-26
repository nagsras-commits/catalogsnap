import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, LifeBuoy, LogOut, PauseCircle } from "lucide-react";

export function AccountPausedPage() {
  const { actor, isFetching } = useBackend();
  const { signOut } = useAuth();

  const storeQuery = useQuery({
    queryKey: ["my-store"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyStore();
    },
    enabled: !!actor && !isFetching,
  });

  const store = storeQuery.data;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 md:py-16">
      <div className="animate-fade-in-up rounded-2xl border border-warning/40 bg-card p-6 shadow-elevated">
        <span className="flex size-12 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
          <PauseCircle className="size-6" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground">
          Your store is paused
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {store?.store_name ? (
            <>
              <span className="font-semibold text-foreground">
                {store.store_name}
              </span>{" "}
              is temporarily hidden from buyers. Your products and analytics are
              safe — nothing has been deleted.
            </>
          ) : (
            "Your storefront is temporarily hidden from buyers. Your products and analytics are safe."
          )}
        </p>

        {store?.status_notes && (
          <div
            data-ocid="paused.status_note"
            className="mt-5 flex items-start gap-2.5 rounded-xl border border-warning/40 bg-warning/15 px-3.5 py-3"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning-foreground"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-warning-foreground">
                Note from admin
              </p>
              <p className="mt-1 text-sm text-foreground">
                {store.status_notes}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-2.5">
          <Button
            asChild
            size="lg"
            data-ocid="paused.contact_button"
            className="w-full rounded-full"
          >
            <a href="mailto:support@catalogsnap.app?subject=Store%20reactivation%20request">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Request reactivation
            </a>
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            data-ocid="paused.sign_out_button"
            onClick={signOut}
            className="w-full rounded-full"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already reactivated?{" "}
        <Link
          to="/dashboard"
          data-ocid="paused.dashboard_link"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Go to your dashboard
        </Link>
      </p>
    </div>
  );
}
