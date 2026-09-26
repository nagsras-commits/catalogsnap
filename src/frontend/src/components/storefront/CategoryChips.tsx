interface CategoryChipsProps {
  categories: string[];
  active: string | null;
  onSelect: (category: string | null) => void;
}

/**
 * Horizontally scrollable category rail. "All items" clears the filter; the
 * active chip uses the forest-green primary fill.
 */
export function CategoryChips({
  categories,
  active,
  onSelect,
}: CategoryChipsProps) {
  if (categories.length === 0) return null;

  const chips: Array<{ key: string; label: string; value: string | null }> = [
    { key: "all", label: "All items", value: null },
    ...categories.map((category) => ({
      key: category,
      label: category,
      value: category,
    })),
  ];

  return (
    <div
      data-ocid="storefront.category_chips"
      className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
    >
      {chips.map((chip) => {
        const isActive = active === chip.value;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onSelect(chip.value)}
            aria-pressed={isActive}
            data-ocid={`storefront.category_chip.${chip.key}`}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-subtle"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
