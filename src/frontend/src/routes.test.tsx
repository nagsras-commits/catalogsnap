import type { Session } from "@/hooks/use-auth";
import {
  type MockActor,
  createMockActor,
  makeAdminSession,
  makeOwnerSession,
  makeSession,
} from "@/test/mock-actor";
import { createTestQueryClient } from "@/test/render";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actorRef: { current: MockActor } = { current: createMockActor() };
const sessionRef: { current: Session } = { current: makeSession() };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: actorRef.current,
    isFetching: false,
    isReady: true,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => sessionRef.current,
}));

// Import after the mocks are registered.
import { router } from "@/routes";

function renderAt(path: string) {
  const queryClient = createTestQueryClient();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  void router.navigate({ to: path as never, replace: true });
  return result;
}

beforeEach(() => {
  actorRef.current = createMockActor();
  sessionRef.current = makeSession();
  void router.navigate({ to: "/", replace: true });
});

describe("route authorization", () => {
  it("shows the landing sign-in button on the default route", async () => {
    renderAt("/");

    expect(
      await screen.findByRole("button", {
        name: /sign in to manage your store/i,
      }),
    ).toBeInTheDocument();
  });

  it("lets an admin reach /admin", async () => {
    sessionRef.current = makeAdminSession();
    actorRef.current = createMockActor({
      getSystemMetrics: vi.fn().mockResolvedValue({
        total_clicks: 42n,
        active_stores: 3n,
        paused_stores: 1n,
      }),
      listAllStores: vi.fn().mockResolvedValue([]),
    });

    renderAt("/admin");

    expect(await screen.findByTestId("admin.page")).toBeInTheDocument();
    expect(screen.getByText("Control panel")).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor from /dashboard to the landing sign-in", async () => {
    sessionRef.current = makeSession();

    renderAt("/dashboard");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(
      await screen.findByRole("button", {
        name: /sign in to manage your store/i,
      }),
    ).toBeInTheDocument();
  });

  it("redirects an unauthenticated visitor from /admin to the landing sign-in", async () => {
    sessionRef.current = makeSession();

    renderAt("/admin");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(
      await screen.findByRole("button", {
        name: /sign in to manage your store/i,
      }),
    ).toBeInTheDocument();
  });

  it("redirects a signed-in non-admin away from /admin", async () => {
    sessionRef.current = makeOwnerSession();
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(null),
      getPublicProducts: vi.fn().mockResolvedValue([]),
    });

    renderAt("/admin");

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/dashboard");
    });
  });
});
