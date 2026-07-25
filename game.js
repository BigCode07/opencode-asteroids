'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

// ── Power-ups ─────────────────────────────────────────────────────────────────
const POWERUP_RADIUS         = 14;
const POWERUP_LIFETIME       = 8;    // s que el item vive en pantalla
const POWERUP_DROP_CHANCE    = 0.18;  // prob. de drop al destruir asteroide grande
const POWERUP_SPEED_DURATION = 5;     // duración del efecto al recogerlo
const THRUST_BOOST_MULT      = 2;     // multiplicador de empuje durante el boost
const POWERUP_TYPES          = ['speed', 'triple', 'shield'];
const POWERUP_TRIPLE_DURATION = 5;     // duración del triple disparo
const TRIPLE_COUNT           = 3;     // nº de balas por disparo
const TRIPLE_OFFSET          = 7;     // px de desfase longitudinal entre balas

// ── Escudo (power-up) ─────────────────────────────────────────────────────────
const SHIELD_DURATION = 6;     // s de duración base al recoger
const SHIELD_HIT_COST = 1;     // s consumidos por cada impacto absorbido
const SHIELD_RADIUS   = 22;    // radio del anillo de colisión

// ── Estrella fugaz (asteroide especial) ───────────────────────────────────────
const SHOOTING_STAR_SPEED    = 250;   // px/s (3x asteroide más rápido)
const SHOOTING_STAR_LIFETIME = 3;      // s antes de desaparecer sola
const SHOOTING_STAR_POINTS   = 500;    // bonus por destruir
const SHOOTING_STAR_RADIUS   = 12;    // radio de colisión

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── ShootingStar (estrella fugaz) ─────────────────────────────────────────────
class ShootingStar {
  constructor(x, y) {
    this.x      = x;
    this.y      = y;
    this.radius = SHOOTING_STAR_RADIUS;
    this.dead   = false;
    this.ttl    = SHOOTING_STAR_LIFETIME;
    this.life   = SHOOTING_STAR_LIFETIME;

    const angle = rand(0, Math.PI * 2);
    const speed = SHOOTING_STAR_SPEED + rand(-30, 30);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rot = angle;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const alpha = Math.max(0, this.ttl / this.life);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    // Estela
    ctx.strokeStyle = `rgba(0, 255, 255, ${(alpha * 0.5).toFixed(2)})`;
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-18, 0);
    ctx.stroke();

    // Núcleo (estrella de 5 puntas)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
    ctx.fillStyle   = `rgba(0, 255, 255, ${(alpha * 0.6).toFixed(2)})`;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    const R = this.radius;
    const r = R * 0.45;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? R : r;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// ── Skins ─────────────────────────────────────────────────────────────────────
// Cada skin varía únicamente la paleta: color de línea y de llamas.
// La silueta (vértices) se mantiene idéntica en todas.
const SKINS = [
  { id: 'classic', name: 'Clásica', stroke: '#fff', thrust: '#ff8200', thrustBoost: '#0ff' },
  { id: 'crimson', name: 'Carmesí', stroke: '#ff3b3b', thrust: '#ffaa00', thrustBoost: '#fff' },
  { id: 'ember',   name: 'Brasa',   stroke: '#ff8a2b', thrust: '#ff3b3b', thrustBoost: '#ffd700' },
  { id: 'toxic',   name: 'Tóxica',  stroke: '#a6ff3b', thrust: '#3bff8a', thrustBoost: '#0ff' },
  { id: 'plasma',  name: 'Plasma',  stroke: '#ff3bff', thrust: '#a23bff', thrustBoost: '#3b9bff' },
];
const SKIN_STORAGE_KEY = 'asteroids.skin';
let selectedSkinIdx = 0;

function loadSelectedSkin() {
  try {
    const id = localStorage.getItem(SKIN_STORAGE_KEY);
    if (id) {
      const idx = SKINS.findIndex(s => s.id === id);
      if (idx >= 0) selectedSkinIdx = idx;
    }
  } catch (_) { /* localStorage deshabilitado: usar por defecto */ }
}
function saveSelectedSkin() {
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, SKINS[selectedSkinIdx].id);
  } catch (_) { /* localStorage deshabilitado: ignorar */ }
}
function currentSkin() { return SKINS[selectedSkinIdx]; }

loadSelectedSkin();

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.dead          = false;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.shield        = 0;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.speedBoost    > 0) this.speedBoost    -= dt;
    if (this.tripleShot    > 0) this.tripleShot    -= dt;
    if (this.shield        > 0) this.shield        -= dt;

    const ROT    = 3.5;                                       // rad/s
    const THRUST = this.speedBoost > 0 ? 260 * THRUST_BOOST_MULT : 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const cx = Math.cos(this.angle);
    const cy = Math.sin(this.angle);
    if (this.tripleShot <= 0) {
      return [new Bullet(this.x + cx * NOSE, this.y + cy * NOSE, this.angle)];
    }
    // Triple: 3 balas en fila india con desfase longitudinal
    const shots = [];
    for (let i = 0; i < TRIPLE_COUNT; i++) {
      const back = i * TRIPLE_OFFSET;
      shots.push(new Bullet(this.x + cx * (NOSE - back), this.y + cy * (NOSE - back), this.angle));
    }
    return shots;
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición (sólo el cuerpo de la nave)
    const hideBody = this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0;

const skin = currentSkin();
    if (!hideBody) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.strokeStyle = skin.stroke;
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = 'round';

      // Silueta clásica: triángulo con muesca trasera
      ctx.beginPath();
      ctx.moveTo( 20,  0);   // nariz
      ctx.lineTo(-12, -9);   // ala izquierda
      ctx.lineTo( -7,  0);   // muesca trasera
      ctx.lineTo(-12,  9);   // ala derecha
      ctx.closePath();
      ctx.stroke();

      // Llama del propulsor
      if (this.thrusting && Math.random() > 0.35) {
        const boosted = this.speedBoost > 0;
        const flameColor = boosted ? skin.thrustBoost : skin.thrust;
        const r = parseInt(flameColor.slice(1, 3), 16);
        const g = parseInt(flameColor.slice(3, 5), 16);
        const b = parseInt(flameColor.slice(5, 7), 16);
        const alpha = boosted ? 0.9 : 0.85;
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-8 - rand(boosted ? 10 : 6, boosted ? 22 : 14), 0);
        ctx.lineTo(-8,  4);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.stroke();
      }

      ctx.restore();
    }

    // Anillo de escudo (se dibuja siempre, ignora el parpadeo de invencibilidad)
    if (this.shield > 0) {
      // Parpadeo en el último segundo
      if (this.shield < 1 && Math.floor(this.shield * 8) % 2 === 0) return;
      const pct = this.shield / SHIELD_DURATION;
      ctx.strokeStyle = `rgba(124, 196, 255, ${(0.35 + pct * 0.45).toFixed(2)})`;
      ctx.fillStyle   = `rgba(80, 180, 255, ${(0.06 + pct * 0.06).toFixed(2)})`;
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, SHIELD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x  = x;
    this.y  = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  constructor(x, y, type = 'speed') {
    this.x      = x;
    this.y      = y;
    this.type   = type;
    this.radius = POWERUP_RADIUS;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 50);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.rot  = rand(0, Math.PI * 2);
    this.rotSpeed = rand(-1.5, 1.5);
    this.ttl  = POWERUP_LIFETIME;
    this.life = POWERUP_LIFETIME;
    this.dead = false;
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    // Parpadeo en el último segundo
    if (this.ttl < 1 && Math.floor(this.ttl * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    const isTriple = this.type === 'triple';
    const isShield = this.type === 'shield';
    const accent   = isShield ? '#7cc4ff' : (isTriple ? '#ff0' : '#0ff');
    const baseRgb  = isShield ? '80, 180, 255' : (isTriple ? '255, 255, 0' : '0, 255, 255');
    ctx.fillStyle   = `rgba(${baseRgb}, ${isShield ? 0.20 : 0.18})`;
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Icono
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 2;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';

    if (isTriple) {
      // 3 rayas paralelas horizontales
      ctx.beginPath();
      for (const dy of [-5, 0, 5]) {
        ctx.moveTo(-7, dy);
        ctx.lineTo( 7, dy);
      }
      ctx.stroke();
    } else if (isShield) {
      // Escudo: arco superior + punta inferior
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo( 6, -4);
      ctx.lineTo( 6,  3);
      ctx.quadraticCurveTo(6, 7, 0, 9);
      ctx.quadraticCurveTo(-6, 7, -6, 3);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Rayo central (speed)
      ctx.beginPath();
      ctx.moveTo(-5, -8);
      ctx.lineTo( 3, -1);
      ctx.lineTo(-2, -1);
      ctx.lineTo( 5,  8);
      ctx.lineTo(-3,  1);
      ctx.lineTo( 2,  1);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps, shootingStars;
let score, lives, level;
let state;      // 'menu' | 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function spawnShootingStar() {
  const SAFE_DIST = 130;
  let x, y;
  do {
    x = rand(0, W);
    y = rand(0, H);
  } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
  shootingStars.push(new ShootingStar(x, y));
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerUps  = [];
  shootingStars = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  spawnAsteroids(4);
  spawnShootingStar();
}

function startGame() {
  initGame();
  state = 'playing';
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerUps  = [];
  shootingStars = [];
  ship.reset();
  spawnAsteroids(3 + level);
  spawnShootingStar();
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'menu') {
    if (pressed('ArrowUp')) {
      selectedSkinIdx = (selectedSkinIdx - 1 + SKINS.length) % SKINS.length;
      saveSelectedSkin();
    }
    if (pressed('ArrowDown')) {
      selectedSkinIdx = (selectedSkinIdx + 1) % SKINS.length;
      saveSelectedSkin();
    }
    if (pressed('Space') || pressed('Enter')) {
      saveSelectedSkin();
      startGame();
    }
    return;
  }

  if (state === 'gameover') {
    if (pressed('Space')) state = 'menu';
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    shootingStars.forEach(s => s.update(dt));
    shootingStars = shootingStars.filter(s => !s.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerUps.forEach(p => p.update(dt));
  shootingStars.forEach(s => s.update(dt));

  bullets       = bullets.filter(b => !b.dead);
  particles     = particles.filter(p => !p.dead);
  powerUps      = powerUps.filter(p => !p.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (a.size === 3 && Math.random() < POWERUP_DROP_CHANCE) {
          const type = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
          powerUps.push(new PowerUp(a.x, a.y, type));
        }
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 12);
      }
    }
  }
  bullets       = bullets.filter(b => !b.dead);
  shootingStars = shootingStars.filter(s => !s.dead);

  // Nave vs power-up
  if (!ship.dead) {
    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + POWERUP_RADIUS) {
        p.dead = true;
        if (p.type === 'speed')       ship.speedBoost = POWERUP_SPEED_DURATION;
        else if (p.type === 'triple') ship.tripleShot = POWERUP_TRIPLE_DURATION;
        else if (p.type === 'shield') ship.shield     = SHIELD_DURATION;
      }
    }
    powerUps = powerUps.filter(p => !p.dead);
  }

  // Nave vs asteroide (escudo absorbe impacto perdiendo duración)
  if (ship.shield > 0 && !ship.dead) {
    for (const a of asteroids) {
      if (dist(ship, a) < SHIELD_RADIUS + a.radius * 0.82) {
        a.dead = true;
        explode(a.x, a.y, a.size * 5);
        ship.shield -= SHIELD_HIT_COST;
        if (ship.shield <= 0) break;
        continue;
      }
    }
    asteroids = asteroids.filter(a => !a.dead);
  } else if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }
  }

  // Nave vs estrella fugaz
  if (ship.shield > 0 && !ship.dead) {
    for (const s of shootingStars) {
      if (dist(ship, s) < SHIELD_RADIUS + s.radius) {
        s.dead = true;
        explode(s.x, s.y, 12);
        ship.shield -= SHIELD_HIT_COST;
        if (ship.shield <= 0) break;
        continue;
      }
    }
    shootingStars = shootingStars.filter(s => !s.dead);
  } else if (ship.invincible <= 0 && !ship.dead) {
    for (const s of shootingStars) {
      if (dist(ship, s) < ship.radius + s.radius) {
        killShip();
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = currentSkin().stroke;
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

  // Indicador de power-up Velocidad
  let hudY = 38;
  if (ship.speedBoost > 0) {
    const BAR_W = 60;
    const BAR_H = 5;
    const x = 14;
    const y = hudY;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#0ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('VEL', x, y);

    // Fondo de la barra
    ctx.fillStyle = 'rgba(0, 255, 255, 0.25)';
    ctx.fillRect(x + 32, y - 9, BAR_W, BAR_H);

    // Progreso
    const pct = Math.max(0, ship.speedBoost / POWERUP_SPEED_DURATION);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(x + 32, y - 9, BAR_W * pct, BAR_H);

    hudY += 18;
  }

  // Indicador de power-up Triple disparo
  if (ship.tripleShot > 0) {
    const BAR_W = 60;
    const BAR_H = 5;
    const x = 14;
    const y = hudY;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('TRIPLE', x, y);

    // Fondo de la barra
    ctx.fillStyle = 'rgba(255, 255, 0, 0.25)';
    ctx.fillRect(x + 56, y - 9, BAR_W, BAR_H);

    // Progreso
    const pct = Math.max(0, ship.tripleShot / POWERUP_TRIPLE_DURATION);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(x + 56, y - 9, BAR_W * pct, BAR_H);

    hudY += 18;
  }

  // Indicador de Escudo
  if (ship.shield > 0) {
    const BAR_W = 60;
    const BAR_H = 5;
    const x = 14;
    const y = hudY;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#7cc4ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('ESC', x, y);

    // Fondo de la barra
    ctx.fillStyle = 'rgba(124, 196, 255, 0.25)';
    ctx.fillRect(x + 32, y - 9, BAR_W, BAR_H);

    // Progreso
    const pct = Math.max(0, ship.shield / SHIELD_DURATION);
    ctx.fillStyle = '#7cc4ff';
    ctx.fillRect(x + 32, y - 9, BAR_W * pct, BAR_H);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function drawMenu() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 38px monospace';
  ctx.fillText('SELECCIONA TU NAVE', W / 2, 70);

  // Lista de skins con vista previa
  const rowH    = 64;
  const listTop = 130;

  for (let i = 0; i < SKINS.length; i++) {
    const skin = SKINS[i];
    const y    = listTop + i * rowH;
    const sel  = i === selectedSkinIdx;

    // Fila resaltada
    if (sel) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(120, y - 24, W - 240, rowH - 8);
    }

    // Vista previa de la silueta en el color de la skin
    ctx.save();
    ctx.translate(180, y - 6);
    ctx.scale(1.2, 1.2);
    ctx.strokeStyle = skin.stroke;
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo( 20,  0);
    ctx.lineTo(-12, -9);
    ctx.lineTo( -7,  0);
    ctx.lineTo(-12,  9);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Nombre
    ctx.textAlign = 'left';
    ctx.fillStyle = sel ? '#fff' : 'rgba(255,255,255,0.55)';
    ctx.font = `${sel ? 'bold ' : ''}22px monospace`;
    ctx.fillText(skin.name, 230, y);

    // Marcador de selección
    if (sel) {
      ctx.fillStyle = skin.stroke;
      ctx.beginPath();
      ctx.moveTo(118, y - 6);
      ctx.lineTo(128, y);
      ctx.lineTo(118, y + 6);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Instrucciones
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '16px monospace';
  ctx.fillText('↑ ↓ ELEGIR   ·   ESPACIO/ENTER JUGAR', W / 2, H - 40);
}

function draw() {
  if (state === 'menu') { drawMenu(); return; }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerUps.forEach(p => p.draw());
  shootingStars.forEach(s => s.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA VOLVER AL MENÚ`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

state = 'menu';
requestAnimationFrame(loop);
