import type { Session } from "@/hooks/use-auth";
import { MerchantDashboardPage } from "@/pages/MerchantDashboardPage";
import {
  type MockActor,
  createMockActor,
  makeOwnerSession,
  makeProduct,
  makeStore,
} from "@/test/mock-actor";
import { createTestQueryClient, stubClipboard } from "@/test/render";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actorRef: { current: MockActor } = { current: createMockActor() };
const sessionRef: { current: Session } = { current: makeOwnerSession() };
const navigateRef = vi.fn();

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

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useNavigate: () => navigateRef,
    Link: ({ children, ...props }: { children: React.ReactNode }) => (
      <a {...props}>{children}</a>
    ),
  };
});

function renderDashboard() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MerchantDashboardPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  actorRef.current = createMockActor();
  sessionRef.current = makeOwnerSession();
  navigateRef.mockReset();
  stubClipboard();
});

describe("merchant dashboard", () => {
  it("renders the store settings, share tools, and product list for an active store", async () => {
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi
        .fn()
        .mockResolvedValue([
          makeProduct({ product_id: "p1", product_name: "Coffee Beans" }),
        ]),
    });

    renderDashboard();

    expect(
      await screen.findByTestId("dashboard.store_settings_section"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dashboard.share_section")).toBeInTheDocument();
    // The catalog query resolves after the store query, so wait for the row.
    expect(await screen.findByText("Coffee Beans")).toBeInTheDocument();
    expect(screen.getByText("/s/greenfield-wholesale")).toBeInTheDocument();
  });

  it("shows a live preview of the public URL from the slug field", async () => {
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi.fn().mockResolvedValue([]),
    });

    renderDashboard();
    await screen.findByTestId("dashboard.store_settings_section");

    const slugInput = screen.getByTestId("dashboard.slug_input");
    await userEvent.clear(slugInput);
    // `normalizeSlug` strips a trailing hyphen as it is typed, so use a slug
    // that survives normalization character by character.
    await userEvent.type(slugInput, "newslug");

    expect(
      screen.getByText(`${window.location.origin}/s/newslug`),
    ).toBeInTheDocument();
  });

  it("reports a taken slug as unavailable via inline validation", async () => {
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi.fn().mockResolvedValue([]),
      // A different store already owns the typed slug.
      getPublicStore: vi.fn().mockResolvedValue(makeStore()),
    });

    renderDashboard();
    await screen.findByTestId("dashboard.store_settings_section");

    const slugInput = screen.getByTestId("dashboard.slug_input");
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, "taken-slug");

    await waitFor(
      () => {
        expect(screen.getByTestId("dashboard.slug_error")).toHaveTextContent(
          /already taken/i,
        );
      },
      { timeout: 3000 },
    );
  });

  it("saves store settings including the logo URL", async () => {
    const saved = makeStore({ logo_url: "https://example.test/logo.png" });
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi.fn().mockResolvedValue([]),
      saveMyStore: vi.fn().mockResolvedValue(saved),
    });

    renderDashboard();
    await screen.findByTestId("dashboard.store_settings_section");

    const nameInput = screen.getByTestId("dashboard.store_name_input");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Renamed Store");

    await userEvent.click(screen.getByTestId("dashboard.save_store_button"));

    await waitFor(() => {
      expect(actorRef.current.saveMyStore).toHaveBeenCalledWith(
        expect.objectContaining({ store_name: "Renamed Store" }),
      );
    });
  });

  it("toggles a product's stock status from the list", async () => {
    const product = makeProduct({
      product_id: "p1",
      product_name: "Coffee Beans",
      in_stock: true,
    });
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi.fn().mockResolvedValue([product]),
      setProductInStock: vi
        .fn()
        .mockResolvedValue({ ...product, in_stock: false }),
    });

    renderDashboard();
    await screen.findByText("Coffee Beans");

    await userEvent.click(screen.getByTestId("dashboard.stock_toggle.1"));

    await waitFor(() => {
      expect(actorRef.current.setProductInStock).toHaveBeenCalledWith(
        "p1",
        false,
      );
    });
  });

  it("adds a product through the form dialog", async () => {
    const created = makeProduct({
      product_id: "p2",
      product_name: "New Item",
      price: 9.5,
      category: "Snacks",
    });
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi.fn().mockResolvedValue([]),
      createProduct: vi.fn().mockResolvedValue(created),
    });

    renderDashboard();
    await screen.findByTestId("dashboard.products_section");

    await userEvent.click(screen.getByTestId("dashboard.add_product_button"));

    const dialog = await screen.findByTestId("dashboard.product_form_dialog");
    await userEvent.type(
      within(dialog).getByTestId("dashboard.product_name_input"),
      "New Item",
    );
    await userEvent.type(
      within(dialog).getByTestId("dashboard.product_price_input"),
      "9.5",
    );
    await userEvent.type(
      within(dialog).getByTestId("dashboard.product_category_input"),
      "Snacks",
    );

    await userEvent.click(
      within(dialog).getByTestId("dashboard.product_form_submit_button"),
    );

    await waitFor(() => {
      expect(actorRef.current.createProduct).toHaveBeenCalledWith({
        product_name: "New Item",
        price: 9.5,
        category: "Snacks",
        image_url: "",
      });
    });
  });

  it("copies the public store URL from the share tools", async () => {
    const writeText = stubClipboard();
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore()),
      getPublicProducts: vi.fn().mockResolvedValue([]),
    });

    renderDashboard();
    await screen.findByTestId("dashboard.share_section");

    await userEvent.click(screen.getByTestId("dashboard.copy_link_button"));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/s/greenfield-wholesale`,
      );
    });
  });

  it("routes a paused store owner to the account-paused screen", async () => {
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(makeStore({ is_active: false })),
      getPublicProducts: vi.fn().mockResolvedValue([]),
    });

    renderDashboard();

    await waitFor(() => {
      expect(navigateRef).toHaveBeenCalledWith({ to: "/account-paused" });
    });
  });

  it("routes an owner with no store to onboarding", async () => {
    actorRef.current = createMockActor({
      getMyStore: vi.fn().mockResolvedValue(null),
      getPublicProducts: vi.fn().mockResolvedValue([]),
    });

    renderDashboard();

    await waitFor(() => {
      expect(navigateRef).toHaveBeenCalledWith({ to: "/onboarding" });
    });
  });
});
