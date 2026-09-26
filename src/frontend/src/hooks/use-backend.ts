import { createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";

/**
 * Shared backend actor accessor.
 *
 * `useActor` must be called at the top level of a React hook/component — never
 * inside a query or mutation callback. Every data hook in the app funnels
 * through this accessor so the generated bindings stay the single data layer.
 */
export function useBackend() {
  const { actor, isFetching } = useActor(createActor);
  return { actor, isFetching, isReady: !!actor && !isFetching };
}
