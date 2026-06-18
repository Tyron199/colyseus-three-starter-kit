import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config.js";
import { GameRoomState } from "../src/rooms/schema/GameRoomState.js";

describe("GameRoom", () => {
  let colyseus: ColyseusTestServer<typeof appConfig>;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("adds a player to the state on join, removes it on leave", async () => {
    // `room` is the server-side Room instance reference.
    const room = await colyseus.createRoom<GameRoomState>("game", {});

    // `client1` is the client-side `Room` instance reference (same as JavaScript SDK)
    const client1 = await colyseus.connectTo(room);
    assert.strictEqual(client1.sessionId, room.clients[0].sessionId);

    // wait for state sync
    await room.waitForNextPatch();
    assert.strictEqual(1, room.state.players.size);
    assert.ok(room.state.players.get(client1.sessionId));

    await client1.leave();
    assert.strictEqual(0, room.state.players.size);
  });

  it("sanitizes the player name, falling back to Guest", async () => {
    const room = await colyseus.createRoom<GameRoomState>("game", {});

    const client1 = await colyseus.connectTo(room, { name: "  Alice  " });
    await room.waitForNextPatch();
    assert.strictEqual("Alice", room.state.players.get(client1.sessionId)!.name);

    // empty / missing names fall back to "Guest"
    const client2 = await colyseus.connectTo(room, { name: "   " });
    await room.waitForNextPatch();
    assert.strictEqual("Guest", room.state.players.get(client2.sessionId)!.name);
  });

  it("syncs multiple players in the same room", async () => {
    const room = await colyseus.createRoom<GameRoomState>("game", {});

    const client1 = await colyseus.connectTo(room, { name: "One" });
    const client2 = await colyseus.connectTo(room, { name: "Two" });
    await room.waitForNextPatch();

    assert.strictEqual(2, room.state.players.size);

    // each client sees both players in its synchronized copy of the state
    assert.strictEqual(2, client1.state.players.size);
    assert.strictEqual(2, client2.state.players.size);
    assert.ok(client1.state.players.get(client2.sessionId));
  });
});
