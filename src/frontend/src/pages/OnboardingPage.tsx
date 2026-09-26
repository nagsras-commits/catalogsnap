import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useBackend } from "@/hooks/use-backend";
import { useSlugAvailability } from "@/hooks/use-merchant";
import {
  isSlugTakenError,
  isValidSlug,
  isValidWhatsapp,
  normalizeSlug,
  normalizeWhatsapp,
} from "@/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Check, Loader2, Store } from "lucide-react";
import { useState } from "react";

export function OnboardingPage() {
  const { actor } = useBackend();
  const { principal } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const slugValid = isValidSlug(slug);
  const whatsappValid = isValidWhatsapp(whatsapp);
  const nameValid = storeName.trim().length >= 2;
  const slugAvailability = useSlugAvailability(slug, slugValid);
  const slugTaken = slugAvailability === "taken";
  const canSubmit = nameValid && whatsappValid && slugValid && !slugTaken;

  const saveStore = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.saveMyStore({
        store_name: storeName.trim(),
        whatsapp_number: normalizeWhatsapp(whatsapp),
        store_slug: slug,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-store"] });
      void queryClient.invalidateQueries({
        queryKey: ["caller-role", principal],
      });
      void navigate({ to: "/dashboard" });
    },
  });

  function handleNameChange(value: string) {
    setStoreName(value);
    if (!slugTouched) setSlug(normalizeSlug(value));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || saveStore.isPending) return;
    saveStore.mutate();
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 md:py-14">
      <div className="animate-fade-in-up">
        <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elevated">
          <Store className="size-5" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Set up your store
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Three details and your catalog is ready to share. You can change all
          of this later.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        data-ocid="onboarding.form"
        className="mt-7 animate-fade-in-up space-y-5 rounded-2xl border border-border bg-card p-5 shadow-elevated [animation-delay:60ms]"
      >
        <div className="space-y-2">
          <Label htmlFor="store-name">Store name</Label>
          <Input
            id="store-name"
            data-ocid="onboarding.store_name_input"
            value={storeName}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder="Greenfield Wholesale"
            autoComplete="organization"
            maxLength={80}
          />
          {storeName.length > 0 && !nameValid && (
            <p
              data-ocid="onboarding.store_name_error"
              className="text-xs text-destructive"
            >
              Use at least 2 characters.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp number</Label>
          <Input
            id="whatsapp"
            data-ocid="onboarding.whatsapp_input"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="+1 555 010 2233"
            inputMode="tel"
            autoComplete="tel"
          />
          {whatsapp.length > 0 && !whatsappValid && (
            <p
              data-ocid="onboarding.whatsapp_error"
              className="text-xs text-destructive"
            >
              Enter a valid number with 7–15 digits.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Orders open in this WhatsApp chat with the product name prefilled.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Storefront link</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-lg border border-border bg-muted px-2.5 py-2 font-mono text-xs text-muted-foreground">
              /s/
            </span>
            <Input
              id="slug"
              data-ocid="onboarding.slug_input"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(normalizeSlug(event.target.value));
              }}
              placeholder="greenfield-wholesale"
              className="font-mono"
              maxLength={48}
            />
          </div>
          {slug.length > 0 && (
            <p
              data-ocid={
                slugValid && !slugTaken
                  ? "onboarding.slug_success"
                  : "onboarding.slug_error"
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
                  Available — buyers reach you at /s/{slug}
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
          {saveStore.isError && isSlugTakenError(saveStore.error) && (
            <p
              data-ocid="onboarding.slug_server_error"
              className="flex items-center gap-1.5 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              That link is already taken. Try another.
            </p>
          )}
        </div>

        {saveStore.isError && !isSlugTakenError(saveStore.error) && (
          <p
            data-ocid="onboarding.error_state"
            className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            We couldn't save your store. Check your connection and try again.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          data-ocid="onboarding.submit_button"
          disabled={!canSubmit || saveStore.isPending}
          className="w-full rounded-full shadow-elevated"
        >
          {saveStore.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
          Create my store
        </Button>
      </form>
    </div>
  );
}
