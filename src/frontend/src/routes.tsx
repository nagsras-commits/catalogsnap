import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { AccountPausedPage } from "@/pages/AccountPausedPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { LandingPage } from "@/pages/LandingPage";
import { MerchantDashboardPage } from "@/pages/MerchantDashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { StorefrontPage } from "@/pages/StorefrontPage";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect } from "react";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
  notFoundComponent: () => <NotFoundPage />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <RequireAuth>
      <OnboardingPage />
    </RequireAuth>
  ),
});

const accountPausedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account-paused",
  component: () => (
    <RequireAuth>
      <AccountPausedPage />
    </RequireAuth>
  ),
});

/**
 * Dashboard and admin route shells. Their child pages are delivered by
 * dedicated page tasks; the shells own the auth gate and role redirect.
 */
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <RequireAuth>
      <MerchantDashboardPage />
    </RequireAuth>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <RequireAuth requiredRole="admin">
      <AdminDashboardPage />
    </RequireAuth>
  ),
});

const storefrontRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/s/$slug",
  validateSearch: (
    search: Record<string, unknown>,
  ): { q?: string; category?: string } => ({
    q: typeof search.q === "string" ? search.q : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
  }),
  component: StorefrontPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  onboardingRoute,
  accountPausedRoute,
  dashboardRoute,
  adminRoute,
  storefrontRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function RequireAuth({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: "admin";
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  const redirectTo = !isAuthenticated
    ? "/"
    : requiredRole === "admin" && !isAdmin
      ? "/dashboard"
      : null;

  useEffect(() => {
    if (isLoading || redirectTo === null) return;
    void navigate({ to: redirectTo, replace: true });
  }, [isLoading, redirectTo, navigate]);

  if (isLoading || redirectTo !== null) {
    return (
      <div
        data-ocid="auth.loading_state"
        className="flex min-h-[60vh] items-center justify-center"
      >
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <span className="sr-only">
          {redirectTo === null ? "Checking your session" : "Redirecting"}
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
