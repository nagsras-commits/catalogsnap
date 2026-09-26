import { Search, X } from "lucide-react";

interface StoreSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Instant product search. Controlled by the URL-backed search state so a
 * filtered view stays shareable and survives refresh.
 */
export function StoreSearchBar({ value, onChange }: StoreSearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search catalog…"
        aria-label="Search products"
        data-ocid="storefront.search_input"
        className="h-11 w-full rounded-full border border-input bg-card pl-10 pr-10 text-sm text-foreground shadow-subtle outline-none transition-smooth placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          data-ocid="storefront.search_clear_button"
          className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
