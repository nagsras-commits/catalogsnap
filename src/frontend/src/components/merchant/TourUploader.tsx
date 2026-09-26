import type { Store } from "@/backend";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSetMyTour } from "@/hooks/use-merchant";
import { ExternalBlob } from "@caffeineai/object-storage";
import {
  AlertCircle,
  Check,
  Loader2,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { useRef, useState } from "react";

interface TourUploaderProps {
  store: Store;
}

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const ACCEPTED_VIDEO = /^video\/(mp4|webm)$/;

/**
 * Virtual shop tour uploader. Accepts .mp4/.webm through platform file
 * storage with progress feedback, and toggles the public tour on/off.
 */
export function TourUploader({ store }: TourUploaderProps) {
  const setTour = useSetMyTour();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoUrl, setVideoUrl] = useState(store.store_video_url ?? "");
  const [enabled, setEnabled] = useState(store.enable_video_tour);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const hasVideo = videoUrl.length > 0;

  async function handleVideoChange(file: File | undefined) {
    if (!file) return;
    setVideoError(null);

    if (!ACCEPTED_VIDEO.test(file.type)) {
      setVideoError("Choose an .mp4 or .webm video file.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError("Video must be 50 MB or smaller.");
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
      const url = blob.getDirectURL();
      setVideoUrl(url);
      setTour.mutate({ videoUrl: url, enabled: true });
      setEnabled(true);
    } catch {
      setVideoError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleToggle(next: boolean) {
    setEnabled(next);
    setTour.mutate({ videoUrl: hasVideo ? videoUrl : null, enabled: next });
  }

  function handleRemove() {
    setVideoUrl("");
    setEnabled(false);
    setVideoError(null);
    setTour.mutate({ videoUrl: null, enabled: false });
  }

  return (
    <section
      data-ocid="dashboard.tour_section"
      className="rounded-2xl border border-border bg-card p-5 shadow-subtle"
    >
      <header className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Video className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Virtual shop tour
          </h2>
          <p className="text-xs text-muted-foreground">
            A short walkthrough buyers can play from your storefront.
          </p>
        </div>
      </header>

      <div className="mt-5 space-y-4">
        {hasVideo ? (
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              data-ocid="dashboard.tour_preview"
              className="aspect-video w-full bg-black object-contain"
            >
              <track kind="captions" />
            </video>
          </div>
        ) : (
          <div
            data-ocid="dashboard.tour_empty_state"
            className="flex flex-col items-center rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-subtle">
              <Video className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              No tour video yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Upload a short clip of your shop floor, shelves, or packing
              process.
            </p>
          </div>
        )}

        {uploading && (
          <div
            data-ocid="dashboard.tour_upload_progress"
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

        {videoError && (
          <p
            data-ocid="dashboard.tour_error"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5" aria-hidden="true" />
            {videoError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            data-ocid="dashboard.tour_upload_button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            {hasVideo ? "Replace video" : "Upload video"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="sr-only"
            data-ocid="dashboard.tour_input"
            onChange={(event) => {
              void handleVideoChange(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          {hasVideo && (
            <Button
              type="button"
              variant="ghost"
              data-ocid="dashboard.tour_remove_button"
              disabled={setTour.isPending}
              onClick={handleRemove}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Show tour on storefront
            </p>
            <p className="text-xs text-muted-foreground">
              {hasVideo
                ? "Buyers see a Virtual Shop Tour button."
                : "Upload a video to enable this."}
            </p>
          </div>
          <Switch
            checked={enabled}
            disabled={!hasVideo || setTour.isPending}
            data-ocid="dashboard.tour_toggle"
            aria-label="Show tour on storefront"
            onCheckedChange={handleToggle}
          />
        </div>

        {setTour.isError && (
          <p
            data-ocid="dashboard.tour_save_error"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5" aria-hidden="true" />
            We couldn't update your tour. Try again.
          </p>
        )}

        {setTour.isSuccess && !setTour.isPending && (
          <p
            data-ocid="dashboard.tour_success"
            className="flex items-center gap-1.5 text-xs text-success"
          >
            <Check className="size-3.5" aria-hidden="true" />
            Tour settings saved.
          </p>
        )}
      </div>
    </section>
  );
}
