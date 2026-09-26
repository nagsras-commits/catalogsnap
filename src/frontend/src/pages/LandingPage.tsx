import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Store,
} from "lucide-react";

const FEATURES = [
  {
    icon: Store,
    title: "One link, your whole catalog",
    body: "Publish products with prices and stock status to a public storefront that needs no login.",
  },
  {
    icon: MessageCircle,
    title: "Orders land in WhatsApp",
    body: "Buyers tap once and the order opens in your WhatsApp with the product already named.",
  },
  {
    icon: BarChart3,
    title: "Know what sells",
    body: "Track storefront visits and WhatsApp clicks per day, straight from your dashboard.",
  },
] as const;

export function LandingPage() {
  const { signIn, isAuthenticated, isAdmin, isLoading } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:py-16">
      <section className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-subtle">
            <span
              className="size-1.5 animate-pulse-live rounded-full bg-accent"
              aria-hidden="true"
            />
            Wholesale commerce
          </span>

          <h1 className="mt-5 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Your trade catalog,
            <br />
            <span className="text-primary">live in one link.</span>
          </h1>

          <p className="mt-4 max-w-md text-base text-muted-foreground">
            CatalogSnap turns your product list into a fast, mobile-first
            storefront. Buyers browse, check stock, and order on WhatsApp — no
            accounts, no friction.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                data-ocid="landing.continue_button"
                className="rounded-full shadow-elevated"
              >
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  Continue to {isAdmin ? "admin" : "dashboard"}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                data-ocid="landing.sign_in_button"
                onClick={signIn}
                disabled={isLoading}
                className="rounded-full shadow-elevated"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                )}
                Sign in to manage your store
              </Button>
            )}

            <Button
              asChild
              size="lg"
              variant="outline"
              data-ocid="landing.explore_button"
              className="rounded-full"
            >
              <Link to="/s/$slug" params={{ slug: "demo" }} search={{}}>
                See a live storefront
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Secured by Internet Identity. No passwords, no email required.
          </p>
        </div>

        <div className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-elevated [animation-delay:80ms]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Today's ledger
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
              <span
                className="size-1.5 animate-pulse-live rounded-full bg-accent-foreground"
                aria-hidden="true"
              />
              Live
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Store visits", value: "1,284" },
              { label: "WhatsApp orders", value: "312" },
              { label: "Products live", value: "48" },
              { label: "Avg. order", value: "$86.40" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-border bg-muted/40 p-3"
              >
                <p className="font-mono text-xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {[
              { name: "Classic Roasted Coffee Beans (1kg)", price: "$24.99" },
              { name: "Almond Milk (6-Pack, 1L each)", price: "$18.50" },
              { name: "Whole Grain Oats (5kg Bag)", price: "$12.75" },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-foreground">
                  {row.name}
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold text-primary">
                  {row.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-subtle"
            style={{ animationDelay: `${120 + index * 40}ms` }}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <feature.icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
              {feature.title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {feature.body}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
