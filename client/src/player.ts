import * as THREE from "three";

/**
 * A simple capsule with a "nose" cone, so you can see which way it's facing,
 * plus a floating name label. Local +Z is forward, matching the server's
 * `heading` convention. Swap this out for your own character model.
 */
export function createPlayerMesh(color: number, name: string): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.38,
    metalness: 0.08,
    emissive: new THREE.Color(color).multiplyScalar(0.18),
  });

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.85, 32),
    new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  shadow.userData.baseOpacity = 0.28;
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.018;
  group.add(shadow);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.6, 4, 16), material);
  body.position.y = 0.7;
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 12), material);
  nose.position.set(0, 0.8, 0.55);
  nose.rotation.x = Math.PI / 2;
  nose.castShadow = true;
  group.add(nose);

  group.add(createNameLabel(name));
  return group;
}

/** Used to dim players that are in the reconnection grace period. */
export function setPlayerOpacity(group: THREE.Group, opacity: number) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
      const material = object.material as THREE.Material;
      const baseOpacity = object.userData.baseOpacity ?? material.opacity ?? 1;
      object.userData.baseOpacity = baseOpacity;
      material.transparent = object instanceof THREE.Sprite || baseOpacity < 1 || opacity < 1;
      material.opacity = baseOpacity * opacity;
    }
  });
}

/** Billboard sprite with the player's name, drawn onto a canvas texture. */
function createNameLabel(name: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;

  const context = canvas.getContext("2d")!;
  context.fillStyle = "rgba(2, 6, 23, 0.62)";
  roundRect(context, 22, 10, 212, 44, 18);
  context.fill();
  context.strokeStyle = "rgba(125, 211, 252, 0.45)";
  context.lineWidth = 2;
  roundRect(context, 22, 10, 212, 44, 18);
  context.stroke();

  context.font = "bold 30px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(14, 165, 233, 0.7)";
  context.shadowBlur = 10;
  context.fillStyle = "#fff";
  context.fillText(name, canvas.width / 2, canvas.height / 2);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthWrite: false }),
  );
  sprite.scale.set(2, 0.5, 1);
  sprite.position.y = 1.9;
  return sprite;
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
