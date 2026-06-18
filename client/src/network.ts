import { Client } from "@colyseus/sdk";

// Type-only import of the server's config: gives us fully typed room names,
// state and messages on the client, without bundling any server code.
import type server from "../../server/src/app.config.js";

// In production the server is expected to be reverse-proxied behind the same
// origin that serves the client. Override with VITE_SERVER_URL if it isn't.
const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV ? "http://localhost:2567" : window.location.origin);

export const client = new Client<typeof server>(SERVER_URL);

/** Join the shared game room (creating it if nobody else has yet). */
export function joinGame(name: string) {
  return client.joinOrCreate("game", { name });
}

export type GameRoom = Awaited<ReturnType<typeof joinGame>>;
