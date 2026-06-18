import { Room, Client, CloseCode } from "colyseus";
import { GameRoomState, Player } from "./schema/GameRoomState.js";

/** How long a dropped player may reconnect before being removed, in seconds. */
const RECONNECTION_GRACE_SECONDS = 30;

const MAX_NAME_LENGTH = 16;

/** A handful of distinct colors handed out to joining players, round-robin. */
const PLAYER_COLORS = [
  0xef4444, // red
  0x3b82f6, // blue
  0x22c55e, // green
  0xeab308, // yellow
  0x8b5cf6, // purple
  0xf97316, // orange
  0x14b8a6, // teal
  0xec4899, // pink
];

export interface GameRoomOptions {
  name?: string;
}

/**
 * The authoritative room. This starter kit keeps it deliberately empty: it
 * tracks who is connected and where they spawned, and nothing else. There is no
 * simulation and no input handling yet — wiring those up is your first step.
 *
 * To turn this into a game:
 *   1. Add fields to `GameRoomState` / `Player` (schema/GameRoomState.ts).
 *   2. Receive client messages by filling in the `messages` map below.
 *   3. Run an authoritative loop with `setSimulationInterval` (see onCreate)
 *      that consumes those messages and updates the state every tick.
 * The client already interpolates each player mesh towards its server position,
 * so anything you write into the state shows up automatically.
 */
export class GameRoom extends Room {
  maxClients = 16;
  state = new GameRoomState();

  /**
   * Client → server messages. Empty for now. Add handlers like:
   *
   *   messages = {
   *     input: (client, input) => {
   *       // store the latest input for this player, then consume it in update()
   *     },
   *   };
   *
   * See https://docs.colyseus.io/server/room/#messages
   */
  messages = {};

  onCreate(options: GameRoomOptions) {
    // A fixed-rate authoritative loop. Nothing happens here yet — this is where
    // you'd integrate input into movement, run physics, spawn things, etc.
    //
    // this.setSimulationInterval((deltaTime) => this.update(deltaTime / 1000));
  }

  // update(deltaSeconds: number) {
  //   // advance your game state here, then it syncs to every client for free
  // }

  onJoin(client: Client, options: GameRoomOptions) {
    const player = new Player();
    player.name = sanitizeName(options?.name);
    player.x = (Math.random() - 0.5) * 10;
    player.z = (Math.random() - 0.5) * 10;
    player.heading = Math.random() * Math.PI * 2;
    player.color = PLAYER_COLORS[this.clients.length % PLAYER_COLORS.length];

    this.state.players.set(client.sessionId, player);
    console.log(client.sessionId, "joined!");
  }

  async onLeave(client: Client, code: CloseCode) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    if (code === CloseCode.CONSENTED) {
      this.state.players.delete(client.sessionId);
      console.log(client.sessionId, "left!");
      return;
    }

    // abnormal drop (backgrounded tab, network blip): keep the player around
    // for a grace period so the SDK can reconnect them seamlessly
    player.connected = false;
    console.log(client.sessionId, "dropped, waiting for reconnection...");

    try {
      await this.allowReconnection(client, RECONNECTION_GRACE_SECONDS);
      player.connected = true;
      console.log(client.sessionId, "reconnected!");
    } catch {
      this.state.players.delete(client.sessionId);
      console.log(client.sessionId, "left! (reconnection expired)");
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}

function sanitizeName(name: unknown): string {
  return String(name ?? "").trim().slice(0, MAX_NAME_LENGTH) || "Guest";
}
