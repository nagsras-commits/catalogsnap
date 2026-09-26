import type { Product } from "@/backend";
import { formatPrice } from "@/lib/format";
import { ImageOff, MessageCircle } from "lucide-react";

interface ProductCardProps {
  product: Product;
  index: number;
  onOrder: (product: Product) => void;
}

/**
 * Catalog tile: media, title, price, stock badge, and the WhatsApp order CTA.
 * Out-of-stock products keep the CTA visible but disabled with a clear reason.
 */
export function ProductCard({ product, index, onOrder }: ProductCardProps) {
  const inStock = product.in_stock;

  return (
    <article
      data-ocid={`storefront.product_card.${index}`}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-subtle transition-smooth hover:shadow-elevated"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.product_name}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-7" aria-hidden="true" />
          </div>
        )}
        {!inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-background">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-snug text-foreground">
          {product.product_name}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          <span
            data-ocid={`storefront.stock_badge.${index}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              inStock
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                inStock ? "bg-accent-foreground" : "bg-muted-foreground"
              }`}
              aria-hidden="true"
            />
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOrder(product)}
          disabled={!inStock}
          data-ocid={`storefront.order_button.${index}`}
          className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground transition-smooth hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {inStock ? "Order on WhatsApp" : "Unavailable"}
        </button>
      </div>
    </article>
  );
}
