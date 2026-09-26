import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface VideoTourPlayerProps {
  videoUrl: string;
  storeName: string;
  onClose: () => void;
}

/**
 * Fullscreen vertical HTML5 video tour. Native controls, Escape to close,
 * and body scroll locked while open.
 */
export function VideoTourPlayer({
  videoUrl,
  storeName,
  onClose,
}: VideoTourPlayerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <dialog
      open
      data-ocid="storefront.video_tour_modal"
      aria-label={`${storeName} virtual shop tour`}
      className="fixed inset-0 z-50 m-0 flex h-dvh max-h-none w-screen max-w-none flex-col bg-foreground/95 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <p className="font-display text-sm font-semibold text-background">
          {storeName} — Virtual Shop Tour
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close video tour"
          data-ocid="storefront.video_tour_close_button"
          className="flex size-10 items-center justify-center rounded-full bg-background/10 text-background transition-smooth hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-3 pb-6">
        <video
          src={videoUrl}
          controls
          autoPlay
          playsInline
          data-ocid="storefront.video_tour_player"
          className="max-h-full w-full max-w-md rounded-lg bg-black object-contain shadow-float"
        >
          <track kind="captions" />
        </video>
      </div>
    </dialog>
  );
}
