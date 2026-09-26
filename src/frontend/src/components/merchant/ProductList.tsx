import type { Product } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useDeleteProduct, useSetProductInStock } from "@/hooks/use-merchant";
import { formatPrice } from "@/lib/format";
import { ImageOff, Loader2, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ProductListProps {
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
}

/**
 * Merchant product table. Stock toggles inline; edit opens the form dialog;
 * delete confirms first. Numeric values are right-aligned for scanning.
 */
export function ProductList({ products, onAdd, onEdit }: ProductListProps) {
  const setInStock = useSetProductInStock();
  const deleteProduct = useDeleteProduct();
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  return (
    <section
      data-ocid="dashboard.products_section"
      className="rounded-2xl border border-border bg-card shadow-subtle"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <Package className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Products
            </h2>
            <p className="text-xs text-muted-foreground">
              {products.length === 0
                ? "No products yet"
                : `${products.length} item${products.length === 1 ? "" : "s"} in your catalog`}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          data-ocid="dashboard.add_product_button"
          onClick={onAdd}
          className="shrink-0 rounded-full"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </header>

      {products.length === 0 ? (
        <div
          data-ocid="dashboard.products_empty_state"
          className="flex flex-col items-center px-5 py-12 text-center"
        >
          <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Package className="size-6" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-base font-semibold text-foreground">
            Your catalog is empty
          </h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Add your first product so buyers have something to order.
          </p>
          <Button
            type="button"
            data-ocid="dashboard.empty_add_product_button"
            onClick={onAdd}
            className="mt-5 rounded-full"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add your first product
          </Button>
        </div>
      ) : (
        <ul
          data-ocid="dashboard.product_list"
          className="divide-y divide-border"
        >
          {products.map((product, index) => {
            const toggling =
              setInStock.isPending &&
              setInStock.variables?.productId === product.product_id;
            const deleting =
              deleteProduct.isPending &&
              deleteProduct.variables === product.product_id;

            return (
              <li
                key={product.product_id}
                data-ocid={`dashboard.product_item.${index + 1}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageOff className="size-5" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {product.product_name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    <span className="truncate rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {product.category}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      checked={product.in_stock}
                      disabled={toggling}
                      data-ocid={`dashboard.stock_toggle.${index + 1}`}
                      aria-label={`Toggle stock for ${product.product_name}`}
                      onCheckedChange={(checked) =>
                        setInStock.mutate({
                          productId: product.product_id,
                          inStock: checked,
                        })
                      }
                    />
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wide ${
                        product.in_stock
                          ? "text-success"
                          : "text-muted-foreground"
                      }`}
                    >
                      {toggling ? "…" : product.in_stock ? "In stock" : "Out"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-ocid={`dashboard.edit_product_button.${index + 1}`}
                    aria-label={`Edit ${product.product_name}`}
                    onClick={() => onEdit(product)}
                    className="size-9 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-ocid={`dashboard.delete_product_button.${index + 1}`}
                    aria-label={`Delete ${product.product_name}`}
                    disabled={deleting}
                    onClick={() => setPendingDelete(product)}
                    className="size-9 text-muted-foreground hover:text-destructive"
                  >
                    {deleting ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="dashboard.delete_product_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete this product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.product_name}" will be removed from your storefront. This can't be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="dashboard.delete_product_cancel_button"
              className="rounded-full"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="dashboard.delete_product_confirm_button"
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete)
                  deleteProduct.mutate(pendingDelete.product_id);
                setPendingDelete(null);
              }}
            >
              Delete product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
