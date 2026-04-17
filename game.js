const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelLabel = document.getElementById("levelLabel");
const coinsLabel = document.getElementById("coinsLabel");
const livesLabel = document.getElementById("livesLabel");
const ballLabel = document.getElementById("ballLabel");
const messageBox = document.getElementById("message");
const startScreen = document.getElementById("startScreen");
const characterGrid = document.getElementById("characterGrid");
const startGameBtn = document.getElementById("startGameBtn");

const levelNames = [
  "Barrio del Carmen",
  "Malecón del Segura",
  "Plaza de las Flores",
  "Huerta Murciana",
  "Castillo de Monteagudo",
  "La Condomina",
];

const worldConfig = {
  gravity: 0.58,
  friction: 0.82,
  jumpPower: -12,
  playerSpeed: 0.66,
  tile: 48,
};

const characters = [
  { name: "Carmen", age: 14, shirt: "#d72638", shorts: "#0d47a1", skin: "#f8d0b0", hair: "#4e342e", archetype: "teen_girl" },
  { name: "Ana", age: 15, shirt: "#8e24aa", shorts: "#00897b", skin: "#f5c7a5", hair: "#212121", archetype: "teen_girl" },
  { name: "Martín", age: 7, shirt: "#1e88e5", shorts: "#f4511e", skin: "#f3c79f", hair: "#5d4037", archetype: "kid_7" },
  { name: "Pablo", age: 7, shirt: "#fbc02d", shorts: "#283593", skin: "#f1c49c", hair: "#3e2723", archetype: "kid_7" },
  { name: "Mateo", age: 5, shirt: "#43a047", shorts: "#6d4c41", skin: "#efbe95", hair: "#6d4c41", archetype: "kid_5" },
  { name: "Inés", age: 5, shirt: "#ec407a", shorts: "#3949ab", skin: "#f6c6a2", hair: "#6a1b9a", archetype: "kid_5" },
  { name: "Jaime", age: 3, shirt: "#fb8c00", shorts: "#5e35b1", skin: "#f0b98f", hair: "#8d6e63", archetype: "kid_3" },
  { name: "Miguel", age: 1, shirt: "#00acc1", shorts: "#6d4c41", skin: "#f1bf97", hair: "#4e342e", archetype: "baby_1" },
];

let keys = { left: false, right: false, jump: false, shoot: false };
let touchJumpQueued = false;
let touchShootQueued = false;

const gameState = {
  levelIndex: 0,
  totalNaranjas: 0,
  lives: 3,
  finished: false,
  selectedCharacter: null,
  started: false,
  shotInProgress: false,
};

function makeLevel(index) {
  const width = 2200 + index * 240;
  const groundY = 450;
  const platforms = [
    { x: -50, y: groundY, w: width + 100, h: 120, color: "#2e7d32" },
    { x: 280, y: 360, w: 210, h: 20, color: "#6f4e37" },
    { x: 640, y: 310, w: 180, h: 20, color: "#6f4e37" },
    { x: 1000, y: 340, w: 170, h: 20, color: "#6f4e37" },
    { x: 1450, y: 320, w: 200, h: 20, color: "#6f4e37" },
  ];

  const goals = [
    { x: 520, y: 390, w: 40, h: 60 },
    { x: 1270, y: 390, w: 40, h: 60 },
    { x: 1780 + index * 120, y: 390, w: 40, h: 60 },
  ];

  const enemies = [
    { x: 780, y: 410, w: 34, h: 40, vx: 1.1 + index * 0.15, minX: 710, maxX: 930, kind: "defensa" },
    { x: 1560, y: 410, w: 34, h: 40, vx: -1 - index * 0.12, minX: 1450, maxX: 1720, kind: "rival" },
  ];

  const naranjas = [
    { x: 320, y: 320, r: 11, taken: false },
    { x: 670, y: 270, r: 11, taken: false },
    { x: 1030, y: 300, r: 11, taken: false },
    { x: 1480, y: 280, r: 11, taken: false },
    { x: 1820 + index * 120, y: 350, r: 11, taken: false },
  ];

  const finishLine = width - 180;
  const finalGoal = { x: finishLine, y: 345, w: 90, h: 105 };
  const goalkeeper = { x: finishLine + 26, y: 388, w: 28, h: 62, dive: 0 };

  return {
    width,
    groundY,
    platforms,
    goals,
    enemies,
    naranjas,
    finishLine,
    finalGoal,
    goalkeeper,
    skyHue: 198 - index * 8,
  };
}

let currentLevel = makeLevel(0);

const player = {
  x: 80,
  y: 390,
  w: 34,
  h: 50,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  invulnFrames: 0,
  hasBall: true,
  ballLostFrames: 0,
};

let cameraX = 0;

function resetPlayerPosition() {
  player.x = 80;
  player.y = 390;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.hasBall = true;
  player.ballLostFrames = 0;
  ballLabel.textContent = "Balón: ✅";
}

function loadLevel(index) {
  currentLevel = makeLevel(index);
  resetPlayerPosition();
  cameraX = 0;
  gameState.shotInProgress = false;
  const characterName = gameState.selectedCharacter ? ` · ${gameState.selectedCharacter.name}` : "";
  levelLabel.textContent = `Nivel ${index + 1}/6 · ${levelNames[index]}${characterName}`;
}

function showMessage(text, duration = 2200) {
  messageBox.textContent = text;
  messageBox.classList.remove("hidden");
  setTimeout(() => messageBox.classList.add("hidden"), duration);
}

function buildCharacterSelection() {
  for (const character of characters) {
    const btn = document.createElement("button");
    btn.className = "character-btn";
    btn.type = "button";
    btn.textContent = character.name;
    btn.addEventListener("click", () => {
      gameState.selectedCharacter = character;
      for (const child of characterGrid.children) child.classList.remove("active");
      btn.classList.add("active");
      startGameBtn.disabled = false;
      audio.ensureStart();
    });
    characterGrid.appendChild(btn);
  }
}

function startGame() {
  if (!gameState.selectedCharacter) return;
  gameState.started = true;
  startScreen.classList.add("hidden");
  levelLabel.textContent = `Nivel ${gameState.levelIndex + 1}/6 · ${levelNames[gameState.levelIndex]} · ${gameState.selectedCharacter.name}`;
  showMessage(`¡${gameState.selectedCharacter.name} salta al césped!`, 2600);
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function applyControls() {
  if (keys.left) {
    player.vx -= worldConfig.playerSpeed;
    player.facing = -1;
  }
  if (keys.right) {
    player.vx += worldConfig.playerSpeed;
    player.facing = 1;
  }

  if ((keys.jump || touchJumpQueued) && player.onGround) {
    player.vy = worldConfig.jumpPower;
    player.onGround = false;
    audio.jump();
  }
  touchJumpQueued = false;

  if (keys.shoot || touchShootQueued) {
    attemptShot();
    keys.shoot = false;
  }
  touchShootQueued = false;

  player.vx *= worldConfig.friction;
  player.vx = Math.max(-6.8, Math.min(6.8, player.vx));
}

function attemptShot() {
  if (gameState.shotInProgress || gameState.finished) return;
  const nearGoal = player.x + player.w >= currentLevel.finalGoal.x - 30;
  if (!nearGoal) return;

  if (!player.hasBall) {
    showMessage("Sin balón no hay chut: recupéralo en unos segundos.");
    return;
  }

  gameState.shotInProgress = true;
  currentLevel.goalkeeper.dive = 34;
  audio.goal();
  showMessage("¡GOOOL! Portero batido.", 1300);

  setTimeout(() => {
    if (gameState.levelIndex < 5) {
      gameState.levelIndex += 1;
      showMessage(`Victoria en ${levelNames[gameState.levelIndex - 1]}! A por la siguiente portería...`);
      loadLevel(gameState.levelIndex);
    } else {
      gameState.finished = true;
      showMessage("¡Campeón de Murcia! Has superado los 6 niveles.", 7000);
      audio.victory();
    }
  }, 1100);
}

function physics() {
  player.vy += worldConfig.gravity;

  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;
  for (const p of currentLevel.platforms) {
    if (player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h >= p.y && player.y + player.h <= p.y + p.h + 13 && player.vy >= 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.y > canvas.height + 180) {
    damagePlayer("Te caíste al río Segura. ¡Vuelve a intentarlo!");
  }

  player.x = Math.max(0, Math.min(currentLevel.width - player.w, player.x));

  cameraX = Math.max(0, Math.min(currentLevel.width - canvas.width, player.x - canvas.width * 0.33));
}

function updateLevelObjects() {
  for (const e of currentLevel.enemies) {
    e.x += e.vx;
    if (e.x <= e.minX || e.x + e.w >= e.maxX) {
      e.vx *= -1;
    }

    if (intersects(player, e) && player.invulnFrames <= 0) {
      player.invulnFrames = 90;
      player.vx = -2.6 * Math.sign(e.vx || 1);
      if (player.hasBall) {
        player.hasBall = false;
        player.ballLostFrames = 180;
        ballLabel.textContent = "Balón: ❌";
        showMessage("¡Un defensa te robó el balón!");
      } else {
        damagePlayer("¡Entrada dura! Pierdes una energía.");
      }
    }
  }

  for (const n of currentLevel.naranjas) {
    if (!n.taken) {
      const orb = { x: n.x - n.r, y: n.y - n.r, w: n.r * 2, h: n.r * 2 };
      if (intersects(player, orb)) {
        n.taken = true;
        gameState.totalNaranjas += 1;
        coinsLabel.textContent = `Naranjas: ${gameState.totalNaranjas}`;
        audio.collect();
      }
    }
  }

  for (const g of currentLevel.goals) {
    if (intersects(player, g)) {
      player.x = g.x + g.w + 8;
      audio.warp();
      showMessage("¡Has entrado por una portería secreta!");
    }
  }

  if (currentLevel.goalkeeper.dive > 0) currentLevel.goalkeeper.dive -= 1;
}

function damagePlayer(text) {
  if (player.invulnFrames > 0) return;
  gameState.lives -= 1;
  livesLabel.textContent = `Energía: ${Math.max(0, gameState.lives)}`;
  player.invulnFrames = 120;
  audio.hit();

  if (gameState.lives <= 0) {
    showMessage("Fin del partido. Reiniciando aventura murciana...", 3200);
    gameState.lives = 3;
    gameState.levelIndex = 0;
    gameState.totalNaranjas = 0;
    coinsLabel.textContent = "Naranjas: 0";
    livesLabel.textContent = "Energía: 3";
    loadLevel(0);
  } else {
    showMessage(text);
    resetPlayerPosition();
  }
}

function drawBackdrop() {
  const hue = currentLevel.skyHue;
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, `hsl(${hue} 88% 73%)`);
  grad.addColorStop(1, `hsl(${hue - 20} 68% 46%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 6; i += 1) {
    const hillX = (i * 320 - cameraX * 0.2) % (canvas.width + 260) - 160;
    ctx.fillStyle = `hsl(${110 + i * 5} 40% ${42 + i * 2}%)`;
    ctx.beginPath();
    ctx.ellipse(hillX, 450, 220, 130, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatform(p) {
  const x = p.x - cameraX;
  ctx.fillStyle = p.color;
  ctx.fillRect(x, p.y, p.w, p.h);

  if (p.y < 430) {
    ctx.fillStyle = "#ccb08a";
    for (let i = 0; i < p.w; i += 24) {
      ctx.fillRect(x + i, p.y, 16, 6);
    }
  }
}

function drawGoal(g) {
  const x = g.x - cameraX;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, g.y, g.w, g.h);
  ctx.strokeStyle = "#f44336";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, g.y, g.w, g.h);

  ctx.strokeStyle = "#e8e8e8";
  ctx.beginPath();
  for (let j = 0; j < 6; j += 1) {
    ctx.moveTo(x, g.y + j * 10);
    ctx.lineTo(x + g.w, g.y + j * 10);
  }
  ctx.stroke();
}

function drawEnemy(e) {
  const x = e.x - cameraX;
  ctx.fillStyle = e.kind === "defensa" ? "#263238" : "#37474f";
  ctx.fillRect(x + 8, e.y, 18, 12); // cabeza
  ctx.fillStyle = "#ffca9a";
  ctx.fillRect(x + 10, e.y + 2, 14, 8);
  ctx.fillStyle = e.kind === "defensa" ? "#fdd835" : "#ab47bc";
  ctx.fillRect(x + 6, e.y + 12, 22, 16); // camiseta
  ctx.fillStyle = "#1e88e5";
  ctx.fillRect(x + 6, e.y + 28, 9, 12);
  ctx.fillRect(x + 19, e.y + 28, 9, 12);
}

function drawNaranja(n) {
  const x = n.x - cameraX;
  ctx.fillStyle = "#ff9800";
  ctx.beginPath();
  ctx.arc(x, n.y, n.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(x - 2, n.y - n.r - 5, 4, 6);
}

function drawPlayer() {
  const blink = player.invulnFrames > 0 && Math.floor(player.invulnFrames / 8) % 2 === 0;
  if (blink) return;
  const selected = gameState.selectedCharacter || characters[0];

  const x = player.x - cameraX;
  const sprite = getCharacterSprite(selected);
  const headTop = player.y + 50 - (sprite.headH + sprite.bodyH + sprite.legH);
  const headX = x + Math.round((player.w - sprite.headW) / 2);
  const bodyX = x + Math.round((player.w - sprite.bodyW) / 2);
  const legX = x + Math.round((player.w - sprite.legW * 2 - sprite.legGap) / 2);

  ctx.fillStyle = selected.skin;
  ctx.fillRect(headX, headTop, sprite.headW, sprite.headH);
  drawHair(headX, headTop, sprite, selected);

  ctx.fillStyle = selected.shirt;
  ctx.fillRect(bodyX, headTop + sprite.headH, sprite.bodyW, sprite.bodyH);
  if (sprite.hasStripe) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bodyX, headTop + sprite.headH + Math.floor(sprite.bodyH * 0.45), sprite.bodyW, 3);
  }

  ctx.fillStyle = selected.shorts;
  const legTop = headTop + sprite.headH + sprite.bodyH;
  ctx.fillRect(legX, legTop, sprite.legW, sprite.legH);
  ctx.fillRect(legX + sprite.legW + sprite.legGap, legTop, sprite.legW, sprite.legH);

  ctx.fillStyle = "#111";
  const footOffset = player.onGround ? Math.sin(Date.now() * 0.02 + player.x * 0.09) * 2.6 : 0;
  ctx.fillRect(legX - 2 + footOffset, player.y + 49, 11, 3);
  ctx.fillRect(legX + sprite.legW + sprite.legGap + 1 - footOffset, player.y + 49, 11, 3);

  if (player.hasBall) {
    const ballX = x + (player.facing > 0 ? 32 : 0);
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ballX, player.y + 44, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.stroke();
  }
}

function getCharacterSprite(character) {
  const sprites = {
    teen_girl: { headW: 13, headH: 14, bodyW: 23, bodyH: 19, legW: 8, legH: 17, legGap: 4, hasStripe: true, ponytail: true, babyCurl: false },
    kid_7: { headW: 14, headH: 14, bodyW: 22, bodyH: 18, legW: 8, legH: 16, legGap: 3, hasStripe: true, ponytail: false, babyCurl: false },
    kid_5: { headW: 16, headH: 15, bodyW: 20, bodyH: 17, legW: 7, legH: 15, legGap: 3, hasStripe: true, ponytail: false, babyCurl: false },
    kid_3: { headW: 18, headH: 16, bodyW: 19, bodyH: 16, legW: 7, legH: 14, legGap: 2, hasStripe: false, ponytail: false, babyCurl: false },
    baby_1: { headW: 20, headH: 17, bodyW: 18, bodyH: 15, legW: 6, legH: 13, legGap: 2, hasStripe: false, ponytail: false, babyCurl: true },
  };
  return sprites[character.archetype] || sprites.kid_7;
}

function drawHair(headX, headTop, sprite, character) {
  ctx.fillStyle = character.hair;
  ctx.fillRect(headX - 1, headTop - 2, sprite.headW + 2, 5);
  if (sprite.ponytail) {
    ctx.fillRect(headX + sprite.headW - 1, headTop + 4, 4, 7);
  }
  if (sprite.babyCurl) {
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(headX + Math.floor(sprite.headW / 2), headTop - 4, 2, 3);
  }
}

function drawFinalGoal() {
  const g = currentLevel.finalGoal;
  const k = currentLevel.goalkeeper;
  const gx = g.x - cameraX;
  const kx = k.x - cameraX + (k.dive > 0 ? Math.sin((34 - k.dive) * 0.7) * 22 : 0);

  ctx.fillStyle = "#fff";
  ctx.fillRect(gx, g.y, g.w, g.h);
  ctx.strokeStyle = "#e53935";
  ctx.lineWidth = 4;
  ctx.strokeRect(gx, g.y, g.w, g.h);

  ctx.strokeStyle = "#eceff1";
  ctx.beginPath();
  for (let j = 1; j < 9; j += 1) {
    ctx.moveTo(gx, g.y + j * 11);
    ctx.lineTo(gx + g.w, g.y + j * 11);
  }
  ctx.stroke();

  ctx.fillStyle = "#212121";
  ctx.fillRect(kx + 6, k.y, 16, 13);
  ctx.fillStyle = "#ffcc80";
  ctx.fillRect(kx + 8, k.y + 3, 12, 8);
  ctx.fillStyle = "#43a047";
  ctx.fillRect(kx + 2, k.y + 13, 24, 26);
  ctx.fillStyle = "#263238";
  ctx.fillRect(kx + 3, k.y + 39, 8, 23);
  ctx.fillRect(kx + 17, k.y + 39, 8, 23);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.fillText("PORTERÍA FINAL", gx - 10, g.y - 12);
}

function drawCityDecor() {
  const towers = [140, 420, 770, 1120, 1510, 1920];
  for (const tx of towers) {
    const x = tx - cameraX * 0.45;
    ctx.fillStyle = "rgba(255, 235, 180, 0.4)";
    ctx.fillRect(x, 220, 90, 230);
    ctx.fillStyle = "rgba(210, 110, 90, 0.45)";
    ctx.fillRect(x + 22, 180, 46, 40);
  }
}

function render() {
  drawBackdrop();
  drawCityDecor();

  for (const p of currentLevel.platforms) drawPlatform(p);
  for (const g of currentLevel.goals) drawGoal(g);
  for (const e of currentLevel.enemies) drawEnemy(e);
  for (const n of currentLevel.naranjas) if (!n.taken) drawNaranja(n);

  drawFinalGoal();
  drawPlayer();

  if (gameState.finished) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("¡Campeón Murciano!", canvas.width / 2 - 180, canvas.height / 2 - 20);
    ctx.font = "24px sans-serif";
    ctx.fillText("Recarga para volver a jugar", canvas.width / 2 - 150, canvas.height / 2 + 28);
  }
}

function tick() {
  if (gameState.started && !gameState.finished) {
    applyControls();
    physics();
    updateLevelObjects();
    if (!player.hasBall && player.ballLostFrames > 0) {
      player.ballLostFrames -= 1;
      if (player.ballLostFrames === 0) {
        player.hasBall = true;
        ballLabel.textContent = "Balón: ✅";
        showMessage("Recuperaste el balón. ¡A chutar!");
      }
    }
    if (player.invulnFrames > 0) player.invulnFrames -= 1;
  }
  render();
  requestAnimationFrame(tick);
}

window.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = true;
  if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = true;
  if (["ArrowUp", " ", "w", "W"].includes(e.key)) keys.jump = true;
  if (["k", "K", "x", "X"].includes(e.key)) keys.shoot = true;
  audio.ensureStart();
});

window.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "a", "A"].includes(e.key)) keys.left = false;
  if (["ArrowRight", "d", "D"].includes(e.key)) keys.right = false;
  if (["ArrowUp", " ", "w", "W"].includes(e.key)) keys.jump = false;
  if (["k", "K", "x", "X"].includes(e.key)) keys.shoot = false;
});

function bindHoldButton(id, stateKey) {
  const btn = document.getElementById(id);
  const activate = () => {
    keys[stateKey] = true;
    audio.ensureStart();
  };
  const deactivate = () => {
    keys[stateKey] = false;
  };
  ["touchstart", "mousedown"].forEach((ev) => btn.addEventListener(ev, (e) => {
    e.preventDefault();
    activate();
  }));
  ["touchend", "touchcancel", "mouseup", "mouseleave"].forEach((ev) => btn.addEventListener(ev, deactivate));
}

bindHoldButton("btnLeft", "left");
bindHoldButton("btnRight", "right");

const jumpBtn = document.getElementById("btnJump");
["touchstart", "mousedown"].forEach((ev) => jumpBtn.addEventListener(ev, (e) => {
  e.preventDefault();
  touchJumpQueued = true;
  audio.ensureStart();
}));

const shootBtn = document.getElementById("btnShoot");
["touchstart", "mousedown"].forEach((ev) => shootBtn.addEventListener(ev, (e) => {
  e.preventDefault();
  touchShootQueued = true;
  audio.ensureStart();
}));

const audio = (() => {
  let started = false;
  let actx;
  let master;
  let beatTimer;
  let noteIndex = 0;
  const melody = [
    392.0, 440.0, 494.0, 523.25, 494.0, 440.0, 392.0, 329.63,
    349.23, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66, 329.63,
  ];

  function ensureStart() {
    if (started) return;
    started = true;
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = 0.14;
    master.connect(actx.destination);
    startMusic();
  }

  function tone(freq, dur = 0.15, type = "square", gain = 0.12) {
    if (!actx) return;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(master);
    const now = actx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }

  function kick() {
    if (!actx) return;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, actx.currentTime + 0.14);
    g.gain.setValueAtTime(0.25, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.14);
    osc.connect(g);
    g.connect(master);
    osc.start();
    osc.stop(actx.currentTime + 0.14);
  }

  function startMusic() {
    beatTimer = setInterval(() => {
      tone(melody[noteIndex % melody.length], 0.2, "triangle", 0.08);
      if (noteIndex % 2 === 0) tone(melody[(noteIndex + 4) % melody.length] / 2, 0.22, "sawtooth", 0.04);
      if (noteIndex % 4 === 0) kick();
      noteIndex += 1;
    }, 180);
  }

  function jump() { tone(600, 0.08, "square", 0.11); }
  function collect() { tone(880, 0.12, "triangle", 0.15); }
  function warp() { tone(520, 0.09, "sawtooth", 0.09); tone(780, 0.14, "square", 0.08); }
  function hit() { tone(110, 0.2, "sawtooth", 0.2); }
  function goal() {
    [659, 784, 988].forEach((n, i) => setTimeout(() => tone(n, 0.2, "square", 0.17), i * 90));
  }
  function victory() {
    [523, 659, 784, 1046].forEach((n, i) => setTimeout(() => tone(n, 0.3, "triangle", 0.16), i * 140));
    if (beatTimer) clearInterval(beatTimer);
  }

  return { ensureStart, jump, collect, warp, hit, goal, victory };
})();

buildCharacterSelection();
startGameBtn.addEventListener("click", startGame);

showMessage("Elige personaje, pulsa “Comenzar partido” y usa “🥅 Chutar” al llegar a portería.", 6000);
loadLevel(0);
tick();
