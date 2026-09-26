/**
 * Shared formatting helpers for CatalogSnap.
 * Backend timestamps are Motoko nanosecond bigints — always convert through
 * `timestampToDate` before touching a JavaScript Date.
 */

export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return "$0.00";
  return `$${price.toFixed(2)}`;
}

export function formatCount(value: bigint | number): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Normalize a store slug: lowercase, alphanumeric + single hyphens. */
export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length >= 3 &&
    slug.length <= 48
  );
}

/**
 * Detect the backend's slug-uniqueness rejection.
 *
 * `createStore`/`updateStore` trap with "Slug already taken"; the actor surfaces
 * that as an Error whose message contains the trap text. Matching on the message
 * lets the UI show inline feedback on the slug field instead of a generic
 * save failure.
 */
export function isSlugTakenError(error: unknown): boolean {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /slug already taken/i.test(message);
}

/** Strip everything but digits and a leading + from a WhatsApp number. */
export function normalizeWhatsapp(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function isValidWhatsapp(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

/** Build a wa.me deep link with a prefilled order message. */
export function whatsappOrderLink(
  whatsappNumber: string,
  storeName: string,
  productName: string,
): string {
  const digits = whatsappNumber.replace(/\D/g, "");
  const message = `Hi ${storeName}, I'd like to order: ${productName}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
