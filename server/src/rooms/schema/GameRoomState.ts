import { Schema, type, MapSchema } from "@colyseus/schema";

/**
 * One connected player. Everything declared with `@type` here is automatically
 * synchronized to every client via `@colyseus/schema` — add fields as your game
 * needs them (health, velocity, animation state, …).
 */
export class Player extends Schema {

  @type("string") name: string = "Guest";

  /** World position. The starter kit spawns players here but doesn't move them
   *  yet — that's your job (see GameRoom.ts). */
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;

  /** Rotation around the Y axis, in radians. */
  @type("number") heading: number = 0;

  /** Hex color, e.g. 0xff0000 */
  @type("uint32") color: number = 0xffffff;

  /** False while the player is in the reconnection grace period. */
  @type("boolean") connected: boolean = true;

}

/**
 * The full synchronized room state. Add more collections and fields here as you
 * build out your game (projectiles, pickups, a match timer, a score, …).
 */
export class GameRoomState extends Schema {

  @type({ map: Player }) players = new MapSchema<Player>();

}
