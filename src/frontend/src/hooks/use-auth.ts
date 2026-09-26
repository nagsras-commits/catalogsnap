import { UserRole } from "@/backend";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "./use-backend";

export type SessionRole = UserRole | "anonymous";

export interface Session {
  /** The signed-in principal, or null when anonymous. */
  principal: string | null;
  /** Resolved role: admin, user, or anonymous when not signed in. */
  role: SessionRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** True while the identity or the role lookup is still resolving. */
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
}

/**
 * Shared auth/session hook: exposes the signed-in principal, sign-in,
 * sign-out, and the caller's role. Role is resolved from the backend
 * (`getCallerUserRole`) so authorization stays server-authoritative.
 */
export function useAuth(): Session {
  const { identity, login, clear, isAuthenticated, isInitializing } =
    useInternetIdentity();
  const { actor, isFetching } = useBackend();

  const principal = identity?.getPrincipal().toText() ?? null;

  const roleQuery = useQuery({
    queryKey: ["caller-role", principal],
    queryFn: async (): Promise<UserRole> => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
    staleTime: 30_000,
  });

  const role: SessionRole = !isAuthenticated
    ? "anonymous"
    : (roleQuery.data ?? UserRole.guest);

  return {
    principal,
    role,
    isAuthenticated,
    isAdmin: role === UserRole.admin,
    isLoading: isInitializing || (isAuthenticated && roleQuery.isLoading),
    signIn: () => login(),
    signOut: () => clear(),
  };
}
