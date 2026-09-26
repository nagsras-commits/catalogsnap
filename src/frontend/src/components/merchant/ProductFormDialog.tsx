import type { Product, ProductInput } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-merchant";
import { ExternalBlob } from "@caffeineai/object-storage";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog edits this product; otherwise it creates one. */
  product?: Product | null;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Create/edit product dialog. Owns its own draft state, resets when opened,
 * and uploads the product image through platform file storage.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Reset the draft each time the dialog opens for a given product.
  useEffect(() => {
    if (!open) return;
    setName(product?.product_name ?? "");
    setPrice(product ? String(product.price) : "");
    setCategory(product?.category ?? "");
    setImageUrl(product?.image_url ?? "");
    setImageError(null);
    setUploading(false);
    setUploadProgress(0);
  }, [open, product]);

  const parsedPrice = Number.parseFloat(price);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice >= 0;
  const nameValid = name.trim().length >= 2;
  const categoryValid = category.trim().length >= 1;
  const pending = createProduct.isPending || updateProduct.isPending;
  const canSubmit =
    nameValid && priceValid && categoryValid && !pending && !uploading;

  async function handleImageChange(file: File | undefined) {
    if (!file) return;
    setImageError(null);

    if (!file.type.startsWith("image/")) {
      setImageError("Choose an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 4 MB or smaller.");
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
      setImageUrl(blob.getDirectURL());
    } catch {
      setImageError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const input: ProductInput = {
      product_name: name.trim(),
      price: parsedPrice,
      category: category.trim(),
      image_url: imageUrl,
    };

    if (isEditing && product) {
      updateProduct.mutate(
        { productId: product.product_id, input },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createProduct.mutate(input, { onSuccess: () => onOpenChange(false) });
    }
  }

  const mutationError = createProduct.isError || updateProduct.isError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="dashboard.product_form_dialog"
        className="max-h-[90dvh] overflow-y-auto sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Edit product" : "Add product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details buyers see on your storefront."
              : "Add an item to your catalog with a price and photo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product name</Label>
            <Input
              id="product-name"
              data-ocid="dashboard.product_name_input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Classic Roasted Coffee Beans (1kg)"
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (USD)</Label>
              <Input
                id="product-price"
                data-ocid="dashboard.product_price_input"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                placeholder="24.99"
              />
              {price.length > 0 && !priceValid && (
                <p className="text-xs text-destructive">Enter a valid price.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>
              <Input
                id="product-category"
                data-ocid="dashboard.product_category_input"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Beverages"
                maxLength={40}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product image</Label>
            <div className="flex items-center gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="size-5" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-ocid="dashboard.product_image_upload_button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full"
                >
                  {uploading ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ImagePlus className="size-4" aria-hidden="true" />
                  )}
                  {imageUrl ? "Replace" : "Upload"}
                </Button>
                {imageUrl && (
                  <button
                    type="button"
                    data-ocid="dashboard.product_image_remove_button"
                    onClick={() => setImageUrl("")}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-smooth hover:text-destructive"
                  >
                    <X className="size-3" aria-hidden="true" />
                    Remove image
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              data-ocid="dashboard.product_image_input"
              onChange={(event) => {
                void handleImageChange(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {uploading && (
              <div
                data-ocid="dashboard.product_image_progress"
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
            {imageError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="size-3.5" aria-hidden="true" />
                {imageError}
              </p>
            )}
          </div>

          {mutationError && (
            <p
              data-ocid="dashboard.product_form_error"
              className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <AlertCircle
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              We couldn't save this product. Check your connection and try
              again.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="dashboard.product_form_cancel_button"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="dashboard.product_form_submit_button"
              disabled={!canSubmit}
              className="rounded-full"
            >
              {pending && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {isEditing ? "Save product" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
