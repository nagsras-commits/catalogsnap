import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "@tanstack/react-router";
import { LogOut, Store } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  /** Hide the marketing header/footer for focused flows (e.g. onboarding). */
  bare?: boolean;
}

/**
 * Shared app shell: sticky header on `bg-card`, content on `bg-background`,
 * and a compact attribution footer. Header and footer are visually distinct
 * from the content zone.
 */
export function Layout({ children, bare = false }: LayoutProps) {
  const { isAuthenticated, signOut } = useAuth();
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {!bare && (
        <header className="sticky top-0 z-40 border-b border-border bg-card shadow-subtle">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
            <Link
              to="/"
              data-ocid="nav.home_link"
              className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Store className="size-4" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                CatalogSnap
              </span>
            </Link>

            {isAuthenticated && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-ocid="nav.sign_out_button"
                onClick={signOut}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            )}
          </div>
        </header>
      )}

      <main className="flex-1">{children}</main>

      {!bare && (
        <footer className="safe-bottom border-t border-border bg-muted/40">
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
            <p className="font-mono">
              CatalogSnap — wholesale catalogs, one link.
            </p>
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="transition-smooth hover:text-foreground"
            >
              © {year}. Built with love using caffeine.ai
            </a>
          </div>
        </footer>
      )}
    </div>
  );
}
