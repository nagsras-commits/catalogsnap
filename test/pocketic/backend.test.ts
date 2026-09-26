import { PocketIc, createIdentity } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

/**
 * Backend behavior lane for CatalogSnap.
 *
 * Installs the app's own compiled wasm into the platform's PocketIC replica and
 * calls the real public API. The frontend suite mocks the actor, so it would
 * pass identically against a canister whose methods are unimplemented stubs;
 * this lane is what proves the admin pause/continue path, the public storefront
 * reads, and the caller-isolation rules actually work.
 *
 * Shapes follow the generated declarations, not the frontend wrapper: `?T` is
 * `[] | [T]`, `Nat`/`Int` are `bigint`, and a unit reply decodes to `null`.
 */

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";
// Set only on a converted project; this app's first migration has an empty
// OldActor, so the runner installs the current wasm directly.
const BASELINE_WASM = process.env.BACKEND_WASM_BASELINE;

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

const admin = createIdentity("catalogsnap-admin");
const merchant = createIdentity("catalogsnap-merchant");
const shopper = createIdentity("catalogsnap-shopper");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  if (BASELINE_WASM === undefined) {
    ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: BACKEND_WASM,
    }));
    return;
  }
  const installed = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BASELINE_WASM,
  });
  await pic.upgradeCanister({
    canisterId: installed.canisterId,
    wasm: BACKEND_WASM,
    arg: new Uint8Array(),
  });
  ({ actor, canisterId } = installed);
});

afterAll(async () => {
  await pic?.tearDown();
});

/** Register `identity` and return an actor that calls as it. */
async function registerAs(identity: ReturnType<typeof createIdentity>) {
  const caller = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  caller.setIdentity(identity);
  await caller._initialize_access_control();
  return caller;
}

it("answers the public storefront reads instead of trapping", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.getPublicStore("no-such-store")).resolves.toEqual([]);
  await expect(guest.getPublicProducts("no-such-store")).resolves.toEqual([]);
});

it("registers the first caller as admin and a later caller as user", async () => {
  const adminActor = await registerAs(admin);
  await expect(adminActor.getCallerUserRole()).resolves.toEqual({
    admin: null,
  });
  await expect(adminActor.isCallerAdmin()).resolves.toBe(true);

  const merchantActor = await registerAs(merchant);
  await expect(merchantActor.getCallerUserRole()).resolves.toEqual({
    user: null,
  });
  await expect(merchantActor.isCallerAdmin()).resolves.toBe(false);
});

it("round-trips a store through saveMyStore and the public storefront", async () => {
  const merchantActor = await registerAs(merchant);
  const saved = await merchantActor.saveMyStore({
    store_name: "Greenfield Wholesale",
    whatsapp_number: "+15550102233",
    store_slug: "greenfield-wholesale",
    logo_url: [],
  });
  expect(saved.store_name).toBe("Greenfield Wholesale");
  expect(saved.is_active).toBe(true);

  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  const publicStore = await guest.getPublicStore("greenfield-wholesale");
  expect(publicStore).toHaveLength(1);
  expect(publicStore[0]).toMatchObject({
    store_name: "Greenfield Wholesale",
    whatsapp_number: "+15550102233",
    is_active: true,
  });
});

it("pauses a store as admin and reflects it on the public catalog", async () => {
  const adminActor = await registerAs(admin);
  const merchantActor = await registerAs(merchant);
  const saved = await merchantActor.saveMyStore({
    store_name: "Paused Pantry",
    whatsapp_number: "+15550109999",
    store_slug: "paused-pantry",
    logo_url: [],
  });

  const paused = await adminActor.setStoreActive(
    saved.store_id,
    false,
    ["Back on Monday"],
  );
  expect(paused.is_active).toBe(false);
  expect(paused.status_notes).toEqual(["Back on Monday"]);

  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  const publicStore = await guest.getPublicStore("paused-pantry");
  expect(publicStore).toHaveLength(1);
  expect(publicStore[0].is_active).toBe(false);
  expect(publicStore[0].status_notes).toEqual(["Back on Monday"]);
  // Pausing never deletes the catalog.
  expect(publicStore[0].store_name).toBe("Paused Pantry");

  const metrics = await adminActor.getSystemMetrics();
  expect(metrics.paused_stores).toBeGreaterThanOrEqual(1n);
});

it("continues a paused store as admin", async () => {
  const adminActor = await registerAs(admin);
  const merchantActor = await registerAs(merchant);
  const saved = await merchantActor.saveMyStore({
    store_name: "Resumed Roasters",
    whatsapp_number: "+15550101111",
    store_slug: "resumed-roasters",
    logo_url: [],
  });

  await adminActor.setStoreActive(saved.store_id, false, ["Paused"]);
  const resumed = await adminActor.setStoreActive(saved.store_id, true, []);
  expect(resumed.is_active).toBe(true);
  expect(resumed.status_notes).toEqual([]);

  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  const publicStore = await guest.getPublicStore("resumed-roasters");
  expect(publicStore[0].is_active).toBe(true);
});

it("rejects a non-admin caller from the admin endpoints", async () => {
  const merchantActor = await registerAs(merchant);
  await expect(merchantActor.listAllStores()).rejects.toThrow();
  await expect(merchantActor.getSystemMetrics()).rejects.toThrow();
  await expect(
    merchantActor.setStoreActive("any-store", false, []),
  ).rejects.toThrow();
});

it("rejects an anonymous caller from the admin endpoints", async () => {
  const guest = pic!.createActor<_SERVICE>(idlFactory, canisterId);
  await expect(guest.listAllStores()).rejects.toThrow();
  await expect(guest.getSystemMetrics()).rejects.toThrow();
});

it("does not let one merchant read another merchant's store", async () => {
  const merchantActor = await registerAs(merchant);
  await merchantActor.saveMyStore({
    store_name: "Merchant One",
    whatsapp_number: "+15550102222",
    store_slug: "merchant-one",
    logo_url: [],
  });

  const other = createIdentity("catalogsnap-other-merchant");
  const otherActor = await registerAs(other);
  await expect(otherActor.getMyStore()).resolves.toEqual([]);
});
