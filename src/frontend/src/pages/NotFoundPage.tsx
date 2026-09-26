import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Compass, Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        404 — page not found
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
        This shelf is empty
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Button
        asChild
        size="lg"
        data-ocid="not_found.home_button"
        className="mt-7 rounded-full shadow-elevated"
      >
        <Link to="/">
          <Home className="size-4" aria-hidden="true" />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
