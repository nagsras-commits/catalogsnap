import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pause, Play } from "lucide-react";
import { useState } from "react";

interface StoreStatusToggleProps {
  storeName: string;
  isActive: boolean;
  isPending: boolean;
  onToggle: (active: boolean, note: string | null) => void;
}

/**
 * Per-store Continue/Pause control. Pausing reveals an optional status note
 * that the owner sees on the paused notice page. The note is local draft state
 * and is only sent when the admin confirms the pause.
 */
export function StoreStatusToggle({
  storeName,
  isActive,
  isPending,
  onToggle,
}: StoreStatusToggleProps) {
  const [note, setNote] = useState("");
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const handleContinue = () => {
    setIsNoteOpen(false);
    setNote("");
    onToggle(true, null);
  };

  const handlePause = () => {
    if (!isNoteOpen) {
      setIsNoteOpen(true);
      return;
    }
    const trimmed = note.trim();
    onToggle(false, trimmed.length > 0 ? trimmed : null);
    setIsNoteOpen(false);
    setNote("");
  };

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {isActive ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-ocid="admin.pause_button"
          disabled={isPending}
          onClick={handlePause}
          className="rounded-full border-warning/50 text-warning-foreground hover:bg-warning/15 hover:text-warning-foreground"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Pause className="size-4" aria-hidden="true" />
          )}
          {isNoteOpen ? "Confirm pause" : "Pause"}
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          data-ocid="admin.continue_button"
          disabled={isPending}
          onClick={handleContinue}
          className="rounded-full"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
          Continue
        </Button>
      )}

      {isActive && isNoteOpen && (
        <div className="w-full sm:w-56">
          <Label
            htmlFor={`pause-note-${storeName}`}
            className="text-xs text-muted-foreground"
          >
            Status note (optional)
          </Label>
          <Input
            id={`pause-note-${storeName}`}
            data-ocid="admin.status_note_input"
            value={note}
            maxLength={200}
            placeholder="Reason shown to the owner"
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}
