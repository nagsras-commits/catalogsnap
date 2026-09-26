import type { StoreAdminView } from "@/backend";
import { StoreStatusToggle } from "@/components/admin/StoreStatusToggle";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { Store as StoreIcon } from "lucide-react";

interface StoreTableProps {
  stores: StoreAdminView[];
  isLoading: boolean;
  pendingStoreId: string | null;
  onToggle: (storeId: string, active: boolean, note: string | null) => void;
}

function shortPrincipal(principal: string): string {
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 7)}…${principal.slice(-5)}`;
}

/**
 * Resolve a store owner identity to display text.
 *
 * The generated binding types `owner_id` as a `Principal`, but the value that
 * reaches the component can also be a plain string (e.g. a serialized or
 * mocked actor response). Never assume `.toText()` exists — fall back to the
 * string form, then to a neutral placeholder.
 */
function ownerText(owner: StoreAdminView["owner_id"]): string {
  if (typeof owner === "string") return owner;
  if (owner && typeof owner.toText === "function") {
    try {
      return owner.toText();
    } catch {
      return "Unknown owner";
    }
  }
  return "Unknown owner";
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="gap-1.5 rounded-full border-transparent bg-accent text-accent-foreground">
      <span className="size-1.5 rounded-full bg-accent-foreground" />
      Active
    </Badge>
  ) : (
    <Badge className="gap-1.5 rounded-full border-transparent bg-warning/25 text-warning-foreground">
      <span className="size-1.5 rounded-full bg-warning-foreground" />
      Paused
    </Badge>
  );
}

/**
 * Store permission table. Renders a data-dense table on wide screens and a
 * stacked card list on narrow screens so the controls stay usable on mobile.
 */
export function StoreTable({
  stores,
  isLoading,
  pendingStoreId,
  onToggle,
}: StoreTableProps) {
  if (isLoading) {
    const skeletonIds = Array.from(
      { length: 4 },
      (_, i) => `store-skeleton-${i}`,
    );
    return (
      <div
        data-ocid="admin.store_table.loading_state"
        className="space-y-2 rounded-2xl border border-border bg-card p-4"
      >
        {skeletonIds.map((id) => (
          <Skeleton key={id} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div
        data-ocid="admin.store_table.empty_state"
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <StoreIcon className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold tracking-tight text-foreground">
          No stores registered yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Stores appear here as soon as merchants finish onboarding and publish
          their first catalog.
        </p>
      </div>
    );
  }

  return (
    <div
      data-ocid="admin.store_table"
      className="rounded-2xl border border-border bg-card shadow-subtle"
    >
      {/* Wide-screen table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4">Store</TableHead>
              <TableHead className="px-4">Owner</TableHead>
              <TableHead className="px-4">Status</TableHead>
              <TableHead className="px-4">Created</TableHead>
              <TableHead className="px-4 text-right">Permission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store, index) => (
              <TableRow
                key={store.store_id}
                data-ocid={`admin.store_row.${index + 1}`}
              >
                <TableCell className="px-4 py-3">
                  <p className="font-semibold text-foreground">
                    {store.store_name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    /s/{store.store_slug}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span
                    className="font-mono text-xs text-muted-foreground"
                    title={ownerText(store.owner_id)}
                  >
                    {shortPrincipal(ownerText(store.owner_id))}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StatusBadge isActive={store.is_active} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDate(store.created_at)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StoreStatusToggle
                    storeName={store.store_id}
                    isActive={store.is_active}
                    isPending={pendingStoreId === store.store_id}
                    onToggle={(active, note) =>
                      onToggle(store.store_id, active, note)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Narrow-screen card fallback */}
      <ul className="divide-y divide-border md:hidden">
        {stores.map((store, index) => (
          <li
            key={store.store_id}
            data-ocid={`admin.store_card.${index + 1}`}
            className="space-y-3 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {store.store_name}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  /s/{store.store_slug}
                </p>
              </div>
              <StatusBadge isActive={store.is_active} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="min-w-0">
                <dt className="text-muted-foreground">Owner</dt>
                <dd
                  className="truncate font-mono text-foreground"
                  title={ownerText(store.owner_id)}
                >
                  {shortPrincipal(ownerText(store.owner_id))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Created</dt>
                <dd className="text-foreground">
                  {formatDate(store.created_at)}
                </dd>
              </div>
            </dl>

            <StoreStatusToggle
              storeName={store.store_id}
              isActive={store.is_active}
              isPending={pendingStoreId === store.store_id}
              onToggle={(active, note) =>
                onToggle(store.store_id, active, note)
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
