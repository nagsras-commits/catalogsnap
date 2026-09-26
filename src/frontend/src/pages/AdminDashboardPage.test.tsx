import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import {
  type MockActor,
  createMockActor,
  makeStoreAdminView,
} from "@/test/mock-actor";
import { renderWithProviders } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Characterization baseline for the admin control panel.
 *
 * The route gate (RequireAuth) is exercised in `routes.test.tsx`; this file
 * renders the page directly against a typed local actor so the panel's own
 * working behavior — metrics, the populated store list, and the pause/continue
 * controls — is frozen before the owner-display fix lands.
 *
 * The known crash (a store whose `owner_id` cannot be stringified) is
 * deliberately NOT asserted here: the request intentionally changes it.
 */

const actorRef: { current: MockActor } = { current: createMockActor() };

vi.mock("@/hooks/use-backend", () => ({
  useBackend: () => ({
    actor: actorRef.current,
    isFetching: false,
    isReady: true,
  }),
}));

function renderAdmin() {
  return renderWithProviders(<AdminDashboardPage />);
}

beforeEach(() => {
  actorRef.current = createMockActor();
});

describe("admin control panel", () => {
  it("renders system metrics and the populated store list for a signed-in admin", async () => {
    actorRef.current = createMockActor({
      getSystemMetrics: vi.fn().mockResolvedValue({
        total_clicks: 1234n,
        active_stores: 2n,
        paused_stores: 1n,
      }),
      listAllStores: vi.fn().mockResolvedValue([
        makeStoreAdminView({
          store_id: "store-1",
          store_name: "Greenfield Wholesale",
          store_slug: "greenfield-wholesale",
          is_active: true,
        }),
        makeStoreAdminView({
          store_id: "store-2",
          store_name: "Paused Pantry",
          store_slug: "paused-pantry",
          is_active: false,
        }),
      ]),
    });

    renderAdmin();

    expect(await screen.findByTestId("admin.page")).toBeInTheDocument();
    expect(screen.getByText("Control panel")).toBeInTheDocument();

    // Metrics resolve from the actor and render as formatted counts.
    expect(await screen.findByText("1.2K")).toBeInTheDocument();
    expect(screen.getByText("Active stores")).toBeInTheDocument();
    expect(screen.getByText("Paused stores")).toBeInTheDocument();

    // Both stores render with their slug and status, not an error boundary.
    // StoreTable renders a wide table plus a narrow card fallback, so each
    // store name appears twice in the DOM (CSS hides one at a time).
    expect(await screen.findAllByText("Greenfield Wholesale")).not.toHaveLength(
      0,
    );
    expect(screen.getAllByText("Paused Pantry")).not.toHaveLength(0);
    expect(screen.getAllByText("/s/greenfield-wholesale")).not.toHaveLength(0);
    expect(screen.getAllByText("/s/paused-pantry")).not.toHaveLength(0);
    expect(screen.getAllByText("Active")).not.toHaveLength(0);
    expect(screen.getAllByText("Paused")).not.toHaveLength(0);
    expect(screen.queryByTestId("admin.error_state")).not.toBeInTheDocument();
  });

  it("pauses an active store through the admin panel with an optional note", async () => {
    actorRef.current = createMockActor({
      getSystemMetrics: vi.fn().mockResolvedValue({
        total_clicks: 0n,
        active_stores: 1n,
        paused_stores: 0n,
      }),
      listAllStores: vi.fn().mockResolvedValue([
        makeStoreAdminView({
          store_id: "store-1",
          store_name: "Greenfield Wholesale",
          is_active: true,
        }),
      ]),
      setStoreActive: vi
        .fn()
        .mockResolvedValue(makeStoreAdminView({ is_active: false })),
    });

    renderAdmin();
    await screen.findAllByText("Greenfield Wholesale");

    // StoreTable renders the control twice (wide table + narrow card); either
    // instance drives the same handler, so use the first.
    const pauseButton = screen.getAllByTestId("admin.pause_button")[0];
    // First click reveals the note field; the pause is confirmed on the second.
    await userEvent.click(pauseButton);
    const noteInput = await screen.findByTestId("admin.status_note_input");
    await userEvent.type(noteInput, "Back on Monday");
    await userEvent.click(screen.getAllByTestId("admin.pause_button")[0]);

    await waitFor(() => {
      expect(actorRef.current.setStoreActive).toHaveBeenCalledWith(
        "store-1",
        false,
        "Back on Monday",
      );
    });
  });

  it("continues a paused store from the admin panel", async () => {
    actorRef.current = createMockActor({
      getSystemMetrics: vi.fn().mockResolvedValue({
        total_clicks: 0n,
        active_stores: 0n,
        paused_stores: 1n,
      }),
      listAllStores: vi.fn().mockResolvedValue([
        makeStoreAdminView({
          store_id: "store-2",
          store_name: "Paused Pantry",
          is_active: false,
        }),
      ]),
      setStoreActive: vi
        .fn()
        .mockResolvedValue(makeStoreAdminView({ is_active: true })),
    });

    renderAdmin();
    await screen.findAllByText("Paused Pantry");

    await userEvent.click(screen.getAllByTestId("admin.continue_button")[0]);

    await waitFor(() => {
      expect(actorRef.current.setStoreActive).toHaveBeenCalledWith(
        "store-2",
        true,
        null,
      );
    });
  });

  it("shows the empty state when no stores are registered", async () => {
    actorRef.current = createMockActor({
      getSystemMetrics: vi.fn().mockResolvedValue({
        total_clicks: 0n,
        active_stores: 0n,
        paused_stores: 0n,
      }),
      listAllStores: vi.fn().mockResolvedValue([]),
    });

    renderAdmin();

    expect(
      await screen.findByTestId("admin.store_table.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByText("No stores registered yet")).toBeInTheDocument();
  });
});
