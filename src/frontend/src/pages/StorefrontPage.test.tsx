import { StorefrontPage } from "@/pages/StorefrontPage";
import {
  type MockActor,
  createMockActor,
  makeProduct,
  makeStorePublic,
} from "@/test/mock-actor";
import { createTestQueryClient } from "@/test/render";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actorRef: { current: MockActor } = { current: createMockActor() };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: actorRef.current,
    isFetching: false,
    isReady: true,
  }),
}));

function buildRouter() {
  const rootRoute = createRootRoute({
    component: () => (
      <div>
        <Outlet />
      </div>
    ),
  });
  const storefrontRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/s/$slug",
    validateSearch: (
      search: Record<string, unknown>,
    ): { q?: string; category?: string } => ({
      q: typeof search.q === "string" ? search.q : undefined,
      category:
        typeof search.category === "string" ? search.category : undefined,
    }),
    component: StorefrontPage,
  });
  return createRouter({ routeTree: rootRoute.addChildren([storefrontRoute]) });
}

function renderAt(path: string) {
  const router = buildRouter();
  const queryClient = createTestQueryClient();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  void router.navigate({ to: path as never, replace: true });
  return { ...result, router };
}

beforeEach(() => {
  actorRef.current = createMockActor();
  vi.spyOn(window, "open").mockImplementation(() => null);
});

describe("public storefront", () => {
  it("renders the product grid for an active store with no login prompt", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi
        .fn()
        .mockResolvedValue(
          makeStorePublic({ store_name: "Greenfield Wholesale" }),
        ),
      getPublicProducts: vi.fn().mockResolvedValue([
        makeProduct({ product_id: "p1", product_name: "Coffee Beans" }),
        makeProduct({
          product_id: "p2",
          product_name: "Almond Milk",
          category: "Dairy",
          in_stock: false,
        }),
      ]),
    });

    renderAt("/s/greenfield-wholesale");

    expect(
      await screen.findByTestId("storefront.product_grid"),
    ).toBeInTheDocument();
    expect(screen.getByText("Coffee Beans")).toBeInTheDocument();
    expect(screen.getByText("Almond Milk")).toBeInTheDocument();
    expect(screen.getAllByText("$24.99")).toHaveLength(2);
    expect(screen.getByText("In stock")).toBeInTheDocument();
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    // Zero auth wall: no sign-in affordance on the public catalog.
    expect(
      screen.queryByRole("button", { name: /sign in/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the paused banner while keeping store identity visible", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi.fn().mockResolvedValue(
        makeStorePublic({
          store_name: "Paused Pantry",
          is_active: false,
          status_notes: "Back on Monday",
        }),
      ),
      getPublicProducts: vi.fn().mockResolvedValue([makeProduct()]),
    });

    renderAt("/s/paused-pantry");

    expect(
      await screen.findByText(
        "This store is currently paused. Please check back later.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Paused Pantry")).toBeInTheDocument();
    expect(screen.getByText("Back on Monday")).toBeInTheDocument();
  });

  it("filters products by name and reflects the query in the URL", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi.fn().mockResolvedValue(makeStorePublic()),
      getPublicProducts: vi
        .fn()
        .mockResolvedValue([
          makeProduct({ product_id: "p1", product_name: "Coffee Beans" }),
          makeProduct({ product_id: "p2", product_name: "Almond Milk" }),
        ]),
    });

    const { router } = renderAt("/s/greenfield-wholesale");
    await screen.findByText("Coffee Beans");

    const search = screen.getByRole("searchbox", { name: /search products/i });
    await userEvent.type(search, "coffee");

    await waitFor(() => {
      expect(screen.queryByText("Almond Milk")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Coffee Beans")).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({ q: "coffee" });
  });

  it("filters by category chip and reflects it in the URL", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi.fn().mockResolvedValue(makeStorePublic()),
      getPublicProducts: vi.fn().mockResolvedValue([
        makeProduct({
          product_id: "p1",
          product_name: "Coffee Beans",
          category: "Beverages",
        }),
        makeProduct({
          product_id: "p2",
          product_name: "Almond Milk",
          category: "Dairy",
        }),
      ]),
    });

    const { router } = renderAt("/s/greenfield-wholesale");
    await screen.findByText("Coffee Beans");

    await userEvent.click(screen.getByRole("button", { name: "Dairy" }));

    await waitFor(() => {
      expect(screen.queryByText("Coffee Beans")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Almond Milk")).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({ category: "Dairy" });
  });

  it("opens a wa.me order link carrying the product name, price, and page URL", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi
        .fn()
        .mockResolvedValue(
          makeStorePublic({ whatsapp_number: "+1 555 010 2233" }),
        ),
      getPublicProducts: vi.fn().mockResolvedValue([
        makeProduct({
          product_id: "p1",
          product_name: "Coffee Beans",
          price: 24.99,
        }),
      ]),
    });

    renderAt("/s/greenfield-wholesale");
    await screen.findByText("Coffee Beans");

    await userEvent.click(
      screen.getByRole("button", { name: /order on whatsapp/i }),
    );

    expect(window.open).toHaveBeenCalledTimes(1);
    const [url] = vi.mocked(window.open).mock.calls[0];
    expect(String(url)).toContain("https://wa.me/15550102233");
    expect(decodeURIComponent(String(url))).toContain("Coffee Beans");
    expect(decodeURIComponent(String(url))).toContain("$24.99");
    expect(decodeURIComponent(String(url))).toContain(window.location.href);
    expect(actorRef.current.recordWhatsappClick).toHaveBeenCalledWith(
      "greenfield-wholesale",
    );
  });

  it("shows the Virtual Shop Tour button only when the tour is enabled", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi.fn().mockResolvedValue(
        makeStorePublic({
          enable_video_tour: true,
          store_video_url: "https://example.test/tour.mp4",
        }),
      ),
      getPublicProducts: vi.fn().mockResolvedValue([makeProduct()]),
    });

    renderAt("/s/greenfield-wholesale");

    const tourButton = await screen.findByRole("button", {
      name: /virtual shop tour/i,
    });
    await userEvent.click(tourButton);

    expect(
      await screen.findByTestId("storefront.video_tour_modal"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("storefront.video_tour_player"),
    ).toBeInTheDocument();
  });

  it("shows a store-not-found state for an unknown slug", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi.fn().mockResolvedValue(null),
      getPublicProducts: vi.fn().mockResolvedValue([]),
    });

    renderAt("/s/does-not-exist");

    expect(
      await screen.findByTestId("storefront.not_found_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("Store not found")).toBeInTheDocument();
  });

  it("records one storefront visit per mount", async () => {
    actorRef.current = createMockActor({
      getPublicStore: vi.fn().mockResolvedValue(makeStorePublic()),
      getPublicProducts: vi.fn().mockResolvedValue([makeProduct()]),
    });

    renderAt("/s/greenfield-wholesale");
    await screen.findByTestId("storefront.product_grid");

    await waitFor(() => {
      expect(actorRef.current.recordStoreVisit).toHaveBeenCalledWith(
        "greenfield-wholesale",
      );
    });
  });
});
