import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Generated components use `data-ocid` for stable test hooks; teach Testing
// Library to resolve `getByTestId` against it.
configure({ testIdAttribute: "data-ocid" });

afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia, which several UI primitives probe.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// jsdom does not implement HTMLMediaElement.play; the video tour calls it.
if (!HTMLMediaElement.prototype.play) {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
}
if (!HTMLMediaElement.prototype.pause) {
  HTMLMediaElement.prototype.pause = vi.fn();
}
