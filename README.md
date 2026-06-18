# Colyseus + Three.js Starter Kit

A barebones starting point for building **multiplayer 3D browser games**:

- **`server/`** — authoritative game server built with [Colyseus](https://colyseus.io/) (TypeScript, Node.js)
- **`client/`** — 3D client built with [Three.js](https://threejs.org/) + [Vite](https://vite.dev/) (TypeScript)

Out of the box you get the *infrastructure* of a multiplayer game with **no gameplay baked in**: enter a name, join a shared room, and every connected player appears as a 3D avatar that syncs in real time across all browsers. Players don't move yet — adding movement (and whatever else your game needs) is your job, and the wiring is already in place to make it easy. Open two browser tabs and watch them connect.

What's included:

- Authoritative server room with **join / leave + automatic reconnection** (grace period)
- **End-to-end type safety** — the client imports the server's config as a type, so room names, state, and messages are all type-checked
- Three.js **scene, render loop with interpolation, and a follow camera**
- **Keyboard + touch-joystick** input capture, ready to send to the server
- **Server tests** (`@colyseus/testing` + mocha) and a **load-test** harness
- **Deploy config** (PM2 + Colyseus Cloud-compatible entry point)

## Getting started

```bash
npm install   # installs server + client (npm workspaces)
npm run dev   # starts both: server on :2567, client on :5173
```

Then open http://localhost:5173 in a couple of browser tabs.

Other useful commands:

```bash
npm test                    # server room tests
npm run build               # production build of both packages
npm run loadtest -w server  # simulate extra clients connecting
```

In development, the server also exposes the [Colyseus Playground](http://localhost:2567/) and [Monitor](http://localhost:2567/monitor).

## How it works

The server is **authoritative**: clients never set their own state directly. The flow is:

1. The client connects with `client.joinOrCreate("game", { name })` — see `client/src/network.ts`.
2. `GameRoom` adds a `Player` to the room state on join and removes it on leave, holding dropped players through a reconnection grace period — see `server/src/rooms/GameRoom.ts`.
3. The room state (`GameRoomState`: a map of `Player` schemas with `x/y/z`, `heading`, `color`, `name`, `connected`) is automatically synchronized to every client via `@colyseus/schema`.
4. The client listens to state changes with `getStateCallbacks` to spawn/remove meshes, and every frame smoothly interpolates each mesh towards its server position — see `client/src/game.ts`.

The client is fully typed end-to-end: it imports the server's `app.config.ts` **as a type only** (`client/src/network.ts`), so room names, state, and message payloads are all type-checked without bundling any server code.

### Configuration

- Server port: `PORT` env var (default `2567`)
- Server URL used by the client: `VITE_SERVER_URL` (default `http://localhost:2567`)

## Extending the kit

This is the intended starting point — the kit deliberately ships **no movement or game logic**. To turn it into a game:

**1. Add state.** Declare new synchronized fields on `Player` or `GameRoomState` (`server/src/rooms/schema/GameRoomState.ts`). Anything with a `@type(...)` decorator syncs to every client automatically.

**2. Receive input.** The client already captures a movement direction from keyboard + joystick in `client/src/game.ts` — uncomment the `room.send("input", direction)` line. Then handle it on the server by filling in the `messages` map in `GameRoom.ts`:

```ts
messages = {
  input: (client, input) => {
    this.inputs.set(client.sessionId, clampDirection(input));
  },
};
```

**3. Simulate.** Run an authoritative loop with `setSimulationInterval` in `onCreate` (a commented stub is already there) that consumes the stored inputs and writes new positions into the state each tick:

```ts
this.setSimulationInterval((deltaTime) => this.update(deltaTime / 1000));
```

Because the client interpolates toward `player.x/y/z/heading` every frame, anything you write into the state animates on screen for free — no extra client code needed.

**4. Render new things.** Add `onAdd`/`onRemove` callbacks in `client/src/game.ts` for any new collections (projectiles, pickups, …), mirroring the existing `players` handling, and give them meshes in their own factory modules alongside `client/src/player.ts`.

### Ideas for next steps

- Add matchmaking: register Colyseus' built-in `LobbyRoom` and call `.enableRealtimeListing()` to show a live room list (the kit currently joins one shared room).
- Add client-side prediction + reconciliation for your own player to hide input latency.
- Add room options: max players, private rooms with a join code (`filterBy`), game modes.
- Add persistence/auth: map a stable id to a saved profile, or use [`@colyseus/auth`](https://docs.colyseus.io/auth/).

## Project structure

```
├── package.json          # npm workspaces root: dev/build/test scripts
├── server/
│   ├── src/
│   │   ├── index.ts                      # entry point
│   │   ├── app.config.ts                 # rooms + express routes (monitor, playground)
│   │   └── rooms/
│   │       ├── GameRoom.ts               # room lifecycle: join/leave, reconnection (extend here)
│   │       └── schema/GameRoomState.ts   # synchronized state (players)
│   ├── test/GameRoom.test.ts             # room tests (@colyseus/testing + mocha)
│   ├── loadtest/example.ts               # scriptable load-test client
│   └── ecosystem.config.cjs              # PM2 deployment config
└── client/
    ├── index.html                        # join screen + HUD markup
    └── src/
        ├── main.ts                       # bootstrap: name entry → game
        ├── game.ts                       # state callbacks, input wiring, render loop
        ├── network.ts                    # Colyseus client (typed via the server config)
        ├── scene.ts                      # renderer, camera, lights, ground plane
        ├── player.ts                     # player mesh + name label factory
        ├── input.ts                      # keyboard → input vector
        ├── joystick.ts                   # touch joystick → input vector
        └── style.css
```

## Deployment

- **Server:** [Colyseus Cloud](https://docs.colyseus.io/deployment/cloud), or self-host with the included `ecosystem.config.cjs` (`pm2 startOrReload server/ecosystem.config.cjs` after `npm run build`).
- **Client:** any static host. Set `VITE_SERVER_URL` to your server's public URL at build time.

## Docs

- Colyseus: https://docs.colyseus.io/
- Three.js: https://threejs.org/docs/
