import { Client, Room } from "@colyseus/sdk";
import { cli, Options } from "@colyseus/loadtest";

/**
 * Simulated client for load testing. Run with:
 *   npm run loadtest -w server
 *
 * Each virtual client just joins the room and stays connected. Once your game
 * sends messages (e.g. `input`), emit them here to put the server under load —
 * see the commented example below.
 */
export async function main(options: Options) {
    const client = new Client(options.endpoint);
    const room: Room = await client.joinOrCreate(options.roomName, {
        name: "LoadTester",
    });

    console.log("joined successfully!");

    // Example: once you add an `input` message handler, drive the bot around.
    // setInterval(() => {
    //     const angle = Math.random() * Math.PI * 2;
    //     room.send("input", { x: Math.cos(angle), z: Math.sin(angle) });
    // }, 1000);

    room.onLeave((code: number) => {
        console.log("left", code);
    });
}

cli(main);
