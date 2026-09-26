import type { Store } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveMyStore, useSlugAvailability } from "@/hooks/use-merchant";
import {
  isSlugTakenError,
  isValidSlug,
  isValidWhatsapp,
  normalizeSlug,
  normalizeWhatsapp,
} from "@/lib/format";
import { ExternalBlob } from "@caffeineai/object-storage";
import {
  AlertCircle,
  Check,
  ImagePlus,
  Loader2,
  Save,
  Store as StoreIcon,
} from "lucide-react";
import { useRef, useState } from "react";

interface StoreSettingsFormProps {
  store: Store;
}

const MAX_LOGO_BYTES = 4 * 1024 * 1024;

/**
 * Store identity editor: name, WhatsApp number, logo, and slug with a live
 * preview of the public URL. The slug is validated inline before saving.
 */
export function StoreSettingsForm({ store }: StoreSettingsFormProps) {
  const saveStore = useSaveMyStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState(store.store_name);
  const [whatsapp, setWhatsapp] = useState(store.whatsapp_number);
  const [slug, setSlug] = useState(store.store_slug);
  const [logoUrl, setLogoUrl] = useState(store.logo_url ?? "");
  const [logoError, setLogoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const nameValid = storeName.trim().length >= 2;
  const whatsappValid = isValidWhatsapp(whatsapp);
  const slugValid = isValidSlug(slug);
  const slugAvailability = useSlugAvailability(
    slug,
    slugValid,
    store.store_slug,
  );
  const slugTaken = slugAvailability === "taken";
  const serverSlugTaken =
    saveStore.isError && isSlugTakenError(saveStore.error);
  const canSubmit =
    nameValid &&
    whatsappValid &&
    slugValid &&
    !slugTaken &&
    !saveStore.isPending &&
    !uploading;

  const publicUrl = `${window.location.origin}/s/${slug || "your-store"}`;

  async function handleLogoChange(file: File | undefined) {
    if (!file) return;
    setLogoError(null);

    if (!file.type.startsWith("image/")) {
      setLogoError("Choose an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("Logo must be 4 MB or smaller.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(
        bytes,
        file.type,
        file.name,
      ).withUploadProgress((pct) => setUploadProgress(pct));
      setLogoUrl(blob.getDirectURL());
    } catch {
      setLogoError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    saveStore.mutate({
      store_name: storeName.trim(),
      whatsapp_number: normalizeWhatsapp(whatsapp),
      store_slug: slug,
      logo_url: logoUrl.trim() ? logoUrl.trim() : undefined,
    });
  }

  return (
    <section
      data-ocid="dashboard.store_settings_section"
      className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
    >
      <header className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <StoreIcon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Store settings
          </h2>
          <p className="text-xs text-muted-foreground">
            How buyers see you on the public storefront.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${store.store_name} logo`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <ImagePlus className="size-6" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="dashboard.logo_upload_button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full"
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="size-4" aria-hidden="true" />
              )}
              {logoUrl ? "Replace logo" : "Upload logo"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              data-ocid="dashboard.logo_input"
              onChange={(event) => {
                void handleLogoChange(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Square PNG or JPG, up to 4 MB.
            </p>
          </div>
        </div>

        {uploading && (
          <div
            data-ocid="dashboard.logo_upload_progress"
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-smooth"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="font-mono">{uploadProgress}%</span>
          </div>
        )}

        {logoError && (
          <p
            data-ocid="dashboard.logo_error"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {logoError}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="settings-store-name">Store name</Label>
          <Input
            id="settings-store-name"
            data-ocid="dashboard.store_name_input"
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            maxLength={80}
          />
          {storeName.length > 0 && !nameValid && (
            <p className="text-xs text-destructive">
              Use at least 2 characters.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-whatsapp">WhatsApp number</Label>
          <Input
            id="settings-whatsapp"
            data-ocid="dashboard.whatsapp_input"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
          {whatsapp.length > 0 && !whatsappValid && (
            <p className="text-xs text-destructive">
              Enter a valid number with 7–15 digits.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-slug">Storefront link</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-lg border border-border bg-muted px-2.5 py-2 font-mono text-xs text-muted-foreground">
              /s/
            </span>
            <Input
              id="settings-slug"
              data-ocid="dashboard.slug_input"
              value={slug}
              onChange={(event) => setSlug(normalizeSlug(event.target.value))}
              className="font-mono"
              maxLength={48}
            />
          </div>
          {slug.length > 0 && (
            <p
              data-ocid={
                slugValid && !slugTaken
                  ? "dashboard.slug_success"
                  : "dashboard.slug_error"
              }
              className={`flex items-center gap-1.5 text-xs ${
                !slugValid || slugTaken
                  ? "text-destructive"
                  : slugAvailability === "available"
                    ? "text-success"
                    : "text-muted-foreground"
              }`}
            >
              {!slugValid ? (
                <>
                  <AlertCircle className="size-3.5" aria-hidden="true" />
                  Use 3–48 lowercase letters, numbers, and hyphens.
                </>
              ) : slugTaken ? (
                <>
                  <AlertCircle className="size-3.5" aria-hidden="true" />
                  That link is already taken. Try another.
                </>
              ) : slugAvailability === "available" ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  Available
                </>
              ) : (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Checking availability…
                </>
              )}
            </p>
          )}
          {serverSlugTaken && (
            <p
              data-ocid="dashboard.slug_server_error"
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              That link is already taken. Try another.
            </p>
          )}
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Live preview
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-foreground">
              {publicUrl}
            </p>
          </div>
        </div>

        {saveStore.isError && !serverSlugTaken && (
          <p
            data-ocid="dashboard.store_settings_error"
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            We couldn't save your changes. Check your connection and try again.
          </p>
        )}

        {saveStore.isSuccess && !saveStore.isPending && (
          <p
            data-ocid="dashboard.store_settings_success"
            className="flex items-center gap-1.5 text-xs text-success"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Store settings saved.
          </p>
        )}

        <Button
          type="submit"
          data-ocid="dashboard.save_store_button"
          disabled={!canSubmit}
          className="w-full rounded-full sm:w-auto"
        >
          {saveStore.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Save changes
        </Button>
      </form>
    </section>
  );
}
