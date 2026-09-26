import type { Session } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";
import type { MockActor } from "./mock-actor";

/**
 * Render helpers for the frontend suite.
 *
 * The app's data layer is two hooks — `useBackend` (the actor) and `useAuth`
 * (the session). Tests mock those modules directly so every page renders
 * against a typed local actor and a chosen session, with no network.
 */

export interface RenderOptions {
  actor?: MockActor;
  session?: Session;
  /** Extra wrapper content, e.g. a router provider. */
  wrapper?: (children: ReactNode) => ReactNode;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions = {},
): RenderResult {
  const queryClient = createTestQueryClient();
  const inner = (
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
  return render(options.wrapper ? <>{options.wrapper(inner)}</> : inner);
}

/**
 * Install module mocks for `@/hooks/use-backend` and `@/hooks/use-auth`.
 *
 * Call inside `vi.mock` factories; this helper only builds the return values.
 */
export function backendHookValue(actor: MockActor) {
  return { actor, isFetching: false, isReady: true };
}

export function authHookValue(session: Session): Session {
  return session;
}

/** A no-op clipboard stub so ShareTools' copy path is observable. */
export function stubClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}
