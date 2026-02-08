// ==================================================
// FULL POLISHED ZOMBIE FPS – VISIBLE BULLETS, ARMS, UI
// ==================================================

// ---------------- SCENE ----------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6fa3c8);
scene.fog = new THREE.Fog(0x6fa3c8, 20, 160);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ---------------- LIGHTING ----------------
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(30, 50, 20);
sun.castShadow = true;
scene.add(sun);

// ---------------- GROUND ----------------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ color: 0x2e3d2f })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------------- PLAYER ----------------
const player = new THREE.Object3D();
player.position.set(0, 1.7, 0);
scene.add(player);
player.add(camera);

// ---------------- DETAILED GUN ----------------
const gun = new THREE.Group();
const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.9), new THREE.MeshStandardMaterial({ color: 0x222222 }));
const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
gunBarrel.rotation.x = Math.PI / 2;
gunBarrel.position.set(0, -0.02, -0.7);
const gunGrip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.25), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
gunGrip.position.set(0, -0.25, -0.2);
gun.add(gunBody, gunBarrel, gunGrip);
gun.position.set(0.35, -0.35, -0.8);
camera.add(gun);

// ---------------- INPUT ----------------
const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let started = false;
let dead = false;

document.body.addEventListener("click", () => {
  document.body.requestPointerLock();
  started = true;
});

// ---------------- MOUSE LOOK ----------------
let yaw = 0, pitch = 0;
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement !== document.body) return;
  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  player.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// ---------------- PLAYER PHYSICS ----------------
let velY = 0;
const GRAVITY = -0.02;
let grounded = true;

// ---------------- GAME STATE ----------------
let health = 100;
let score = 0;

// ---------------- UI ----------------
const hud = document.createElement("div");
hud.style.position = "fixed";
hud.style.top = "20px";
hud.style.left = "20px";
hud.style.color = "white";
hud.style.font = "16px Arial";
hud.style.zIndex = 10;
document.body.appendChild(hud);

// Player health bar
const healthBox = document.createElement("div");
healthBox.style.position = "fixed";
healthBox.style.bottom = "20px";
healthBox.style.left = "20px";
healthBox.style.width = "220px";
healthBox.style.height = "22px";
healthBox.style.border = "2px solid white";
healthBox.style.zIndex = 10;
const healthFill = document.createElement("div");
healthFill.style.height = "100%";
healthFill.style.width = "100%";
healthFill.style.background = "lime";
healthBox.appendChild(healthFill);
document.body.appendChild(healthBox);

// Crosshair
const crosshair = document.createElement("div");
crosshair.style.position = "fixed";
crosshair.style.left = "50%";
crosshair.style.top = "50%";
crosshair.style.width = "6px";
crosshair.style.height = "6px";
crosshair.style.background = "white";
crosshair.style.transform = "translate(-50%, -50%)";
document.body.appendChild(crosshair);

// Game Over Screen
const gameOver = document.createElement("div");
gameOver.style.position = "fixed";
gameOver.style.inset = "0";
gameOver.style.background = "rgba(0,0,0,0.8)";
gameOver.style.display = "none";
gameOver.style.color = "white";
gameOver.style.font = "48px Arial";
gameOver.style.alignItems = "center";
gameOver.style.justifyContent = "center";
gameOver.style.flexDirection = "column";
gameOver.style.zIndex = 20;
gameOver.style.textAlign = "center";
gameOver.style.display = "flex";
gameOver.style.visibility = "hidden";
gameOver.innerHTML = "GAME OVER<br><span style='font-size:24px'>Press R to Restart</span>";
document.body.appendChild(gameOver);

// ---------------- BULLETS ----------------
const bullets = [];
const raycaster = new THREE.Raycaster();
let lastShot = 0;

document.addEventListener("mousedown", () => {
  if (!started || dead) return;
  const now = performance.now();
  if (now - lastShot < 180) return;
  lastShot = now;

  gun.position.z = -0.9;
  setTimeout(() => gun.position.z = -0.8, 80);

  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.06),
    new THREE.MeshStandardMaterial({ color: 0xfff176, emissive: 0xffee58 })
  );

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  bullet.position.copy(camera.getWorldPosition(new THREE.Vector3()))
    .addScaledVector(dir, 0.8);

  bullet.velocity = dir.clone().multiplyScalar(2.2);
  bullet.life = 35;

  bullets.push(bullet);
  scene.add(bullet);

  // Hitscan damage
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(enemies.map(e => e.hitbox), true);
  if (hits.length > 0) {
    const hit = hits[0];
    const enemy = hit.object.userData.enemy;
    let dmg = hit.object.userData.type === "head" ? 60 : 20;
    enemy.health -= dmg;
    enemy.flash();
    if (enemy.health <= 0) {
      enemy.die();
      score++;
      spawnEnemy();
    }
  }
});

// ---------------- ENEMIES ----------------
const enemies = [];

function spawnEnemy() {
  const z = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.35), skin);
  body.position.y = 1.05;

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skin);
  head.position.y = 1.65;

  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.18), dark);
  armL.position.set(-0.45, 1.05, 0);
  const armR = armL.clone(); armR.position.x = 0.45;

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.2), dark);
  legL.position.set(-0.15, 0.25, 0);
  const legR = legL.clone(); legR.position.x = 0.15;

  z.add(body, head, armL, armR, legL, legR);

  // Hitboxes
  const hitbox = new THREE.Group();
  const bodyBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  bodyBox.position.y = 0.9;
  bodyBox.userData = { enemy: z, type: "body" };
  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  headBox.position.y = 1.65;
  headBox.userData = { enemy: z, type: "head" };
  hitbox.add(bodyBox, headBox);
  z.add(hitbox);
  z.hitbox = hitbox;

  // Enemy health bar
  const barBG = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.08), new THREE.MeshBasicMaterial({ color: 0x550000 }));
  const barFG = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.08), new THREE.MeshBasicMaterial({ color: 0x00ff00 }));
  barFG.position.z = 0.01;
  const bar = new THREE.Group();
  bar.add(barBG, barFG);
  bar.position.y = 2.2;
  z.add(bar);

  z.healthBar = barFG;
  z.health = 100;
  z.speed = 0.02 + Math.random() * 0.02;
  z.jumpTime = Math.random() * Math.PI * 2;

  z.flash = () => {
    body.material.color.set(0xff6666);
    setTimeout(() => body.material.color.set(0x4caf50), 100);
  };

  z.die = () => {
    scene.remove(z);
    enemies.splice(enemies.indexOf(z), 1);
  };

  z.position.set((Math.random() - 0.5) * 120, 0, (Math.random() - 0.5) * 120);
  enemies.push(z);
  scene.add(z);
}

for (let i = 0; i < 6; i++) spawnEnemy();

// ---------------- GAME LOOP ----------------
function animate() {
  requestAnimationFrame(animate);

  if (!started) {
    hud.innerHTML = "CLICK TO START";
    renderer.render(scene, camera);
    return;
  }

  if (dead) return;

  const move = new THREE.Vector3();
  if (keys.w) move.z -= 1;
  if (keys.s) move.z += 1;
  if (keys.a) move.x -= 1;
  if (keys.d) move.x += 1;
  move.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  player.position.addScaledVector(move, 0.12);

  if (keys[" "] && grounded) { velY = 0.35; grounded = false; }
  velY += GRAVITY;
  player.position.y += velY;
  if (player.position.y < 1.7) { player.position.y = 1.7; velY = 0; grounded = true; }

  bullets.forEach((b, i) => {
    b.position.add(b.velocity);
    b.life--;
    if (b.life <= 0) {
      scene.remove(b);
      bullets.splice(i, 1);
    }
  });

  enemies.forEach(z => {
    const dir = player.position.clone().sub(z.position);
    dir.y = 0; dir.normalize();
    z.position.addScaledVector(dir, z.speed);
    z.rotation.y = Math.atan2(dir.x, dir.z);

    z.jumpTime += 0.04;
    z.position.y = Math.max(0, Math.sin(z.jumpTime) * 0.25);

    z.healthBar.scale.x = Math.max(0, z.health / 100);
    z.healthBar.position.x = -0.4 * (1 - z.healthBar.scale.x);

    z.children.forEach(c => {
      if (c.geometry && c.geometry.parameters.height === 0.65) {
        c.rotation.x = Math.sin(performance.now() * 0.006) * 0.6;
      }
    });

    if (z.position.distanceTo(player.position) < 1.2) health -= 0.15;
  });

  healthFill.style.width = Math.max(0, health) + "%";
  hud.innerHTML = `Score: ${score}`;

  if (health <= 0) {
    dead = true;
    gameOver.style.visibility = "visible";
  }

  renderer.render(scene, camera);
}

animate();

// ---------------- RESTART / RESIZE ----------------
document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r" && dead) location.reload();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});