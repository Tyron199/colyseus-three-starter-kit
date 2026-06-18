import * as THREE from "three";
import { getStateCallbacks, CloseCode } from "@colyseus/sdk";

import type { GameRoom } from "./network";
import { createScene } from "./scene";
import { createPlayerMesh, setPlayerOpacity } from "./player";
import { trackInput, type InputVector } from "./input";
import { createJoystick } from "./joystick";

const hudEl = document.getElementById("hud")!;
const statusEl = document.getElementById("status")!;
const playerCountEl = document.getElementById("player-count")!;
const leaveButton = document.getElementById("leave-button") as HTMLButtonElement;
const overlayEl = document.getElementById("overlay")!;
const overlayMessageEl = document.getElementById("overlay-message")!;
const overlayButtonEl = document.getElementById("overlay-button")!;

overlayButtonEl.addEventListener("click", () => window.location.reload());

function showOverlay(message: string, canRejoin: boolean) {
  overlayMessageEl.textContent = message;
  overlayEl.classList.remove("hidden");
  overlayButtonEl.classList.toggle("hidden", !canRejoin);
}

function hideOverlay() {
  overlayEl.classList.add("hidden");
}

export async function startGame(room: GameRoom) {
  hudEl.classList.remove("hidden");

  const { scene, camera, renderer } = createScene();
  const playerMeshes = new Map<string, THREE.Group>();

  const $ = getStateCallbacks(room);

  const updatePlayerCount = () => {
    playerCountEl.textContent = `Players: ${room.state.players.size}`;
  };

  $(room.state).players.onAdd((player, sessionId) => {
    const mesh = createPlayerMesh(player.color, player.name);
    mesh.position.set(player.x, player.y, player.z);
    mesh.rotation.y = player.heading;
    scene.add(mesh);
    playerMeshes.set(sessionId, mesh);
    updatePlayerCount();

    if (sessionId === room.sessionId) {
      statusEl.textContent = `Playing as ${player.name}`;
    }

    // dim a player while they're in the reconnection grace period
    $(player).listen("connected", (connected) => setPlayerOpacity(mesh, connected ? 1 : 0.35));
  });

  $(room.state).players.onRemove((_player, sessionId) => {
    const mesh = playerMeshes.get(sessionId);
    if (mesh) {
      scene.remove(mesh);
      playerMeshes.delete(sessionId);
    }
    updatePlayerCount();
  });

  // ---- input capture -------------------------------------------------------
  // Keyboard and the touch joystick merge into a single direction vector. The
  // starter kit captures it but does NOT send it anywhere yet — wire up the
  // `room.send(...)` call below and a matching handler + simulation on the
  // server (see server/src/rooms/GameRoom.ts) to make players actually move.
  const inputs = { keyboard: { x: 0, z: 0 }, joystick: { x: 0, z: 0 } };

  const handleInput = () => {
    const direction: InputVector = {
      x: THREE.MathUtils.clamp(inputs.keyboard.x + inputs.joystick.x, -1, 1),
      z: THREE.MathUtils.clamp(inputs.keyboard.z + inputs.joystick.z, -1, 1),
    };
    // TODO: send the captured input to the server, e.g.
    // room.send("input", direction);
    void direction;
  };

  trackInput((input) => {
    inputs.keyboard = input;
    handleInput();
  });

  const hasJoystick = createJoystick((input) => {
    inputs.joystick = input;
    handleInput();
  });
  if (hasJoystick) {
    document.querySelector("#hud .hint")!.textContent = "Drag the joystick to move (once wired up)";
  }

  leaveButton.addEventListener("click", async () => {
    await room.leave(true);
    window.location.reload();
  });

  // ---- connection lifecycle ------------------------------------------------
  // the SDK reconnects automatically after brief drops (backgrounded tab,
  // network blip) — the server holds our player for a grace period
  room.onDrop(() => {
    statusEl.textContent = "Connection lost";
    statusEl.classList.add("error");
    showOverlay("Connection lost — reconnecting…", false);
  });

  room.onReconnect(() => {
    statusEl.classList.remove("error");
    const me = room.state.players.get(room.sessionId);
    statusEl.textContent = `Playing as ${me?.name ?? room.sessionId}`;
    hideOverlay();
  });

  // fires only when the session is definitively over (reconnection failed or
  // the grace period expired) — offer a fresh start
  room.onLeave((code) => {
    if (code === CloseCode.CONSENTED) return; // we chose to leave
    statusEl.textContent = "Disconnected";
    statusEl.classList.add("error");
    showOverlay("Disconnected from the game", true);
  });

  // wait for the first full state before rendering — `room.state` is not
  // populated until the initial sync arrives
  await new Promise<void>((resolve) => room.onStateChange.once(() => resolve()));

  // ---- render loop ---------------------------------------------------------
  // smoothly interpolate every mesh towards its server position each frame.
  // nothing moves yet (the server doesn't simulate), but the moment you write
  // positions into the state on the server, they'll animate here for free.
  const targetPosition = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3(0, 9, 12);
  const cameraTarget = new THREE.Vector3();
  let lastTime = performance.now();

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1); // cap after tab switches
    lastTime = now;
    const smoothing = 1 - Math.pow(0.0001, dt); // framerate-independent lerp factor

    room.state?.players?.forEach((player, sessionId) => {
      const mesh = playerMeshes.get(sessionId);
      if (!mesh) return;

      targetPosition.set(player.x, player.y, player.z);
      mesh.position.lerp(targetPosition, smoothing);
      mesh.rotation.y += shortestAngle(mesh.rotation.y, player.heading) * smoothing;
    });

    // follow our own player
    const me = playerMeshes.get(room.sessionId);
    if (me) {
      cameraTarget.copy(me.position).add(cameraOffset);
      camera.position.lerp(cameraTarget, smoothing);
      camera.lookAt(me.position.x, me.position.y + 1, me.position.z);
    }

    renderer.render(scene, camera);
  });
}

/** Smallest signed difference between two angles, in radians. */
function shortestAngle(from: number, to: number): number {
  const delta = (to - from) % (Math.PI * 2);
  return ((2 * delta) % (Math.PI * 2)) - delta;
}
