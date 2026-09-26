import { Button } from "@/components/ui/button";
import { renderQrToCanvas } from "@/lib/qr";
import { Check, Copy, Download, Link2, QrCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ShareToolsProps {
  slug: string;
  storeName: string;
}

/**
 * Share tools: copy the public store URL and download a QR code rendered
 * locally on a canvas (no external service, no runtime cost).
 */
export function ShareTools({ slug, storeName }: ShareToolsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const publicUrl = `${window.location.origin}/s/${slug}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      renderQrToCanvas(canvas, publicUrl, 240);
      setQrError(null);
    } catch {
      setQrError("This link is too long to render as a QR code.");
    }
  }, [publicUrl]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug || "store"}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section
      data-ocid="dashboard.share_section"
      className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
    >
      <header className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Link2 className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Share your store
          </h2>
          <p className="text-xs text-muted-foreground">
            Send the link or print the QR code for your counter.
          </p>
        </div>
      </header>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2.5">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
            {publicUrl}
          </span>
          <Button
            type="button"
            size="sm"
            variant={copied ? "secondary" : "default"}
            data-ocid="dashboard.copy_link_button"
            onClick={() => void handleCopy()}
            className="shrink-0 rounded-full"
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex size-[132px] shrink-0 items-center justify-center rounded-xl border border-border bg-card p-2 shadow-subtle">
            {qrError ? (
              <span className="px-2 text-center text-[11px] text-muted-foreground">
                {qrError}
              </span>
            ) : (
              <canvas
                ref={canvasRef}
                data-ocid="dashboard.qr_canvas"
                role="img"
                aria-label={`QR code linking to ${storeName}'s storefront`}
                className="size-full"
              />
            )}
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-foreground sm:justify-start">
              <QrCode className="size-4 text-primary" aria-hidden="true" />
              Scan to open the catalog
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Download and print it for your shop counter or packaging.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="dashboard.download_qr_button"
              disabled={!!qrError}
              onClick={handleDownload}
              className="mt-3 rounded-full"
            >
              <Download className="size-4" aria-hidden="true" />
              Download QR code
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
