import * as THREE from 'three';
import { gsap } from 'gsap';
import './style.css';

// ==========================================================
// REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================================
const canvas = document.getElementById('galaxy-canvas');
const startBtn = document.getElementById('start-btn');
const fadeOverlay = document.getElementById('fade-overlay');
const finalVideo = document.getElementById('final-video');
const orbitingMessages = document.getElementById('orbiting-messages');
const modal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalImg = document.getElementById('modal-img');
const closeModalBtn = document.getElementById('close-modal');

// ==========================================================
// CONFIGURACIÓN DE THREE.JS (ESCENA, CÁMARA, RENDERIZADOR)
// ==========================================================
let width = window.innerWidth;
let height = window.innerHeight;

const scene = new THREE.Scene();

// Cámara con inclinación espacial dramática
const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
camera.position.set(0, 68, 140);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: false
});
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// ==========================================================
// ILUMINACIÓN CÓSMICA
// ==========================================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.18);
scene.add(ambientLight);

// Luz del sol que baña los planetas con tonos amarillos-cálidos
const sunLight = new THREE.PointLight(0xfff2a3, 4.5, 400, 0.5);
scene.add(sunLight);

// ==========================================================
// EL SOL CENTRAL (CORAZÓN DE LA GALAXIA)
// ==========================================================
const sunGeometry = new THREE.SphereGeometry(7.5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffcc00,
  toneMapped: false
});
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sunMesh);

// Halo de luz sutil para el Sol (Sprite)
const sunGlowGeometry = new THREE.SphereGeometry(8.5, 16, 16);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  transparent: true,
  opacity: 0.18,
  blending: THREE.AdditiveBlending
});
const sunGlowMesh = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
scene.add(sunGlowMesh);

// ==========================================================
// CONFIGURACIÓN Y CARGA DE PLANETAS 3D
// ==========================================================
const textureLoader = new THREE.TextureLoader();

// Función para generar la textura de la Tierra procedimentalmente
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Océano azul profundo
  ctx.fillStyle = '#0f3a61';
  ctx.fillRect(0, 0, 512, 256);
  
  // Dibujamos algunas masas de tierra aleatorias (continentes verdes)
  ctx.fillStyle = '#27632a';
  const seedLand = [
    { x: 90, y: 100, r: 50 },
    { x: 130, y: 120, r: 45 },
    { x: 100, y: 160, r: 35 },
    { x: 290, y: 110, r: 60 },
    { x: 340, y: 140, r: 50 },
    { x: 260, y: 150, r: 35 },
    { x: 440, y: 100, r: 40 },
    { x: 470, y: 130, r: 30 }
  ];
  
  seedLand.forEach(land => {
    ctx.beginPath();
    ctx.arc(land.x, land.y, land.r, 0, Math.PI * 2);
    ctx.fill();
    
    // Zonas de desierto/montañas
    ctx.fillStyle = '#7a5a3a';
    ctx.beginPath();
    ctx.arc(land.x + (Math.random() - 0.5) * 15, land.y + (Math.random() - 0.5) * 15, land.r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#27632a'; // Restaurar verde
  });
  
  // Nubes blancas arremolinadas sutiles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 45 + 15, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return new THREE.CanvasTexture(canvas);
}

// Función para generar la textura de las nubes procedimentalmente
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 256); // Transparente
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 190 + 33;
    const r = Math.random() * 40 + 15;
    
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.55)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

const planetConfigs = [
  { id: 'ball-0', texture: null, size: 0.9, orbitRadius: 16, speed: 0.28, color: 0x8c8c8c, hasRings: false }, // Mercurio
  { id: 'ball-1', texture: '/planet_venus.jpg', size: 1.8, orbitRadius: 22, speed: 0.21, color: 0xffddaa, hasRings: false }, // Venus
  { id: 'ball-2', texture: '/tierra.jpg', size: 2.1, orbitRadius: 30, speed: 0.17, color: 0x3388ff, hasRings: false }, // Tierra
  { id: 'ball-3', texture: '/planet_mars.png', size: 1.4, orbitRadius: 38, speed: 0.13, color: 0xff4422, hasRings: false }, // Marte
  { id: 'ball-4', texture: '/planet_jupiter.png', size: 3.4, orbitRadius: 48, speed: 0.09, color: 0xffccaa, hasRings: false }, // Júpiter
  { id: 'ball-5', texture: '/planet_saturn.png', size: 2.7, orbitRadius: 59, speed: 0.07, color: 0xeecc88, hasRings: true }, // Saturno
  { id: 'ball-6', texture: null, size: 2.1, orbitRadius: 69, speed: 0.05, color: 0xaaffff, hasRings: false }, // Urano
  { id: 'ball-7', texture: '/planet_neptune.png', size: 2.0, orbitRadius: 79, speed: 0.038, color: 0x3366ff, hasRings: false }, // Neptuno
  { id: 'ball-8', texture: null, size: 0.8, orbitRadius: 88, speed: 0.026, color: 0xc4a482, hasRings: false } // Plutón
];

const planets = [];
const planetMap = new Map();

// Dibujar anillos orbitales 3D finos
planetConfigs.forEach(config => {
  const orbitGeo = new THREE.BufferGeometry();
  const points = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta) * config.orbitRadius;
    const z = Math.sin(theta) * config.orbitRadius;
    points.push(new THREE.Vector3(x, 0, z));
  }
  orbitGeo.setFromPoints(points);
  
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0xff66b2,
    transparent: true,
    opacity: 0.16
  });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  scene.add(orbitLine);
});

// Crear los planetas y sus componentes
planetConfigs.forEach((config, index) => {
  let texture = null;
  if (config.texture) {
    texture = textureLoader.load(config.texture, undefined, undefined, (err) => {
      console.warn(`Error al cargar textura: ${config.texture}, se usará material por color.`);
    });
  }
  
  const planetGeo = new THREE.SphereGeometry(config.size, 32, 32);
  const planetMat = new THREE.MeshStandardMaterial({
    map: texture,
    color: config.texture ? 0xffffff : config.color, // No tintar si tiene textura
    roughness: (config.texture === '/tierra.jpg') ? 0.4 : 0.7,
    metalness: 0.15,
    emissive: config.texture ? 0x000000 : config.color, // Evitar brillo emisivo en texturas
    emissiveIntensity: config.texture ? 0.0 : 0.12
  });
  
  // Ajustes para Urano
  if (config.id === 'ball-6') {
    planetMat.roughness = 0.2;
    planetMat.metalness = 0.5;
  }
  
  // Malla base del planeta
  let planetMesh = new THREE.Mesh(planetGeo, planetMat);
  let surfaceMesh = planetMesh;
  let cloudMesh = null;
  
  // Si es la Tierra, crear un grupo con superficie y nubes flotantes independientes
  if (config.texture === '/tierra.jpg') {
    const earthGroup = new THREE.Group();
    earthGroup.add(surfaceMesh);
    
    // Capa de nubes
    const cloudGeo = new THREE.SphereGeometry(config.size * 1.018, 32, 32);
    const cloudTex = createCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.NormalBlending
    });
    cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);
    
    planetMesh = earthGroup;
    planetMesh.userData = {
      surface: surfaceMesh,
      clouds: cloudMesh
    };
  }
  
  // Agregar anillos a Saturno
  if (config.hasRings) {
    const ringGeo = new THREE.RingGeometry(config.size * 1.35, config.size * 2.3, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: config.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      roughness: 0.8
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.1;
    planetMesh.add(ringMesh);
  }
  
  // Pequeño satélite giratorio
  const satelliteGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const satelliteMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
  const satelliteMesh = new THREE.Mesh(satelliteGeo, satelliteMat);
  planetMesh.add(satelliteMesh);
  
  scene.add(planetMesh);
  
  const planetObj = {
    mesh: planetMesh,
    satellite: satelliteMesh,
    config: config,
    angle: (index * (Math.PI * 2 / planetConfigs.length)) + Math.random(),
    currentScale: 1.0,
    targetScale: 1.0,
    isHovered: false
  };
  
  planets.push(planetObj);
  
  const htmlEl = document.getElementById(config.id);
  if (htmlEl) {
    planetMap.set(htmlEl, planetObj);
  }
});

// ==========================================================
// STARFIELD WARP EFFECT (EFECTO VIAJE HIPERESPACIAL)
// ==========================================================
const starsCount = 1500;
const starsGeometry = new THREE.BufferGeometry();
const starsPositions = new Float32Array(starsCount * 3);
const starsSpeeds = new Float32Array(starsCount);

for (let i = 0; i < starsCount * 3; i += 3) {
  starsPositions[i] = (Math.random() - 0.5) * 600;      // X
  starsPositions[i+1] = (Math.random() - 0.5) * 600;    // Y
  starsPositions[i+2] = Math.random() * 1200 - 600;     // Z (de -600 a 600)
  starsSpeeds[i/3] = Math.random() * 0.4 + 0.15;        // velocidad individual
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));

const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 1.25,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true
});

const starfield = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starfield);

let starSpeedMultiplier = 1.0;

function animateStars() {
  const positions = starsGeometry.attributes.position.array;
  for (let i = 0; i < starsCount; i++) {
    const idx = i * 3;
    positions[idx + 2] += starsSpeeds[i] * starSpeedMultiplier;
    
    // Si la estrella pasa detrás de la cámara, re-generar al fondo
    if (positions[idx + 2] > 150) {
      positions[idx + 2] = -850;
      positions[idx] = (Math.random() - 0.5) * 600;
      positions[idx + 1] = (Math.random() - 0.5) * 600;
    }
  }
  starsGeometry.attributes.position.needsUpdate = true;
}

// ==========================================================
// METEORITOS EN MOVIMIENTO (LAVA/FUEGO, inspirado en metiorito.webp)
// ==========================================================
const meteorites = [];
const meteorCount = 16;

for (let i = 0; i < meteorCount; i++) {
  const meteorGroup = new THREE.Group();
  
  // 1. Cabeza: Roca irregular gris/oscura con vetas de lava brillante
  const rockGeo = new THREE.DodecahedronGeometry(Math.random() * 0.6 + 0.35, 0);
  const pos = rockGeo.attributes.position;
  for (let j = 0; j < pos.count; j++) {
    pos.setX(j, pos.getX(j) + (Math.random() - 0.5) * 0.12);
    pos.setY(j, pos.getY(j) + (Math.random() - 0.5) * 0.12);
    pos.setZ(j, pos.getZ(j) + (Math.random() - 0.5) * 0.12);
  }
  rockGeo.computeVertexNormals();
  
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, // Roca gris/carbón
    roughness: 0.95,
    metalness: 0.2,
    emissive: 0xff3700, // Vetas de fuego/lava incandescente
    emissiveIntensity: 2.0
  });
  
  const rockMesh = new THREE.Mesh(rockGeo, rockMat);
  meteorGroup.add(rockMesh);
  
  // 2. Cola: Pluma de fuego volumétrica naranja brillante apuntando hacia atrás
  const fireTailGeo = new THREE.ConeGeometry(0.35, 4.5, 8);
  fireTailGeo.translate(0, -2.25, 0); // Desplazar pivote a la unión con la roca
  const fireTailMat = new THREE.MeshBasicMaterial({
    color: 0xff5500, // Naranja fuego
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const fireTail = new THREE.Mesh(fireTailGeo, fireTailMat);
  fireTail.rotation.x = -Math.PI / 2; // Apuntar directo hacia atrás en -Z
  meteorGroup.add(fireTail);
  
  meteorGroup.position.set(
    (Math.random() - 0.5) * 150,
    (Math.random() - 0.5) * 100,
    Math.random() * -700 - 150
  );
  
  meteorGroup.userData = {
    speed: Math.random() * 1.2 + 0.6,
    rockMesh: rockMesh, // Guardar referencia para rotarlo independientemente
    rotX: (Math.random() - 0.5) * 0.04,
    rotY: (Math.random() - 0.5) * 0.04,
    rotZ: (Math.random() - 0.5) * 0.04
  };
  
  scene.add(meteorGroup);
  meteorites.push(meteorGroup);
}

function animateMeteorites() {
  meteorites.forEach(m => {
    m.position.z += m.userData.speed * starSpeedMultiplier;
    
    // Solo rota la roca, la cola de fuego se mantiene apuntando en dirección opuesta al avance
    m.userData.rockMesh.rotation.x += m.userData.rotX;
    m.userData.rockMesh.rotation.y += m.userData.rotY;
    m.userData.rockMesh.rockRotationZ = (m.userData.rockMesh.rotation.z += m.userData.rotZ);
    
    // Si pasa la cámara, reiniciar en el fondo
    if (m.position.z > 150) {
      m.position.z = -700 - Math.random() * 200;
      m.position.x = (Math.random() - 0.5) * 150;
      m.position.y = (Math.random() - 0.5) * 100;
    }
  });
}

// ==========================================================
// COMETAS CON COLA BRILLANTE (Inspirado en cometas.png: fuego con destellos amarillos, rojos y celestes)
// ==========================================================
const comets = [];
const cometCount = 6;

for (let i = 0; i < cometCount; i++) {
  const cometGroup = new THREE.Group();
  
  // 1. Núcleo brillante blanco/celeste
  const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const head = new THREE.Mesh(headGeo, headMat);
  cometGroup.add(head);
  
  // 2. Núcleo de la cola (Amarillo brillante)
  const innerTailGeo = new THREE.ConeGeometry(0.18, 5.0, 8);
  innerTailGeo.translate(0, -2.5, 0);
  const innerTailMat = new THREE.MeshBasicMaterial({
    color: 0xffdd33,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const innerTail = new THREE.Mesh(innerTailGeo, innerTailMat);
  innerTail.rotation.x = -Math.PI / 2;
  cometGroup.add(innerTail);
  
  // 3. Capa media de la cola (Rojo/Naranja)
  const midTailGeo = new THREE.ConeGeometry(0.35, 7.0, 8);
  midTailGeo.translate(0, -3.5, 0);
  const midTailMat = new THREE.MeshBasicMaterial({
    color: 0xff2200,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const midTail = new THREE.Mesh(midTailGeo, midTailMat);
  midTail.rotation.x = -Math.PI / 2;
  cometGroup.add(midTail);
  
  // 4. Capa exterior de la cola (Celeste suave para el destello)
  const outerTailGeo = new THREE.ConeGeometry(0.42, 8.5, 8);
  outerTailGeo.translate(0, -4.25, 0);
  const outerTailMat = new THREE.MeshBasicMaterial({
    color: 0x33b5e5,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
  const outerTail = new THREE.Mesh(outerTailGeo, outerTailMat);
  outerTail.rotation.x = -Math.PI / 2;
  cometGroup.add(outerTail);
  
  // Spawneo aleatorio profundo
  cometGroup.position.set(
    (Math.random() - 0.5) * 220,
    (Math.random() - 0.5) * 130,
    Math.random() * -800 - 200
  );
  
  // Vector de velocidad (vuela diagonalmente hacia el espectador)
  cometGroup.userData = {
    vx: (Math.random() - 0.5) * 2.0,
    vy: (Math.random() - 0.5) * 1.5,
    vz: Math.random() * 2.8 + 2.2,
    rotZ: (Math.random() - 0.5) * 0.04
  };
  
  scene.add(cometGroup);
  comets.push(cometGroup);
}

function animateComets() {
  comets.forEach(c => {
    c.position.x += c.userData.vx * starSpeedMultiplier;
    c.position.y += c.userData.vy * starSpeedMultiplier;
    c.position.z += c.userData.vz * starSpeedMultiplier;
    
    // Rotar cola sutilmente
    c.rotation.z += c.userData.rotZ;
    
    // Reset al pasar el plano de la cámara
    if (c.position.z > 150) {
      c.position.z = -800 - Math.random() * 200;
      c.position.x = (Math.random() - 0.5) * 220;
      c.position.y = (Math.random() - 0.5) * 130;
      c.userData.vx = (Math.random() - 0.5) * 2.0;
      c.userData.vy = (Math.random() - 0.5) * 1.5;
      c.userData.vz = Math.random() * 2.8 + 2.2;
    }
  });
}

// ==========================================================
// SISTEMA DE PROYECCIÓN 3D A 2D (ANCLAJE DE ETIQUETAS HTML)
// ==========================================================
const tempVector = new THREE.Vector3();

function projectPlanetsToScreen() {
  planets.forEach(p => {
    const htmlEl = document.getElementById(p.config.id);
    if (!htmlEl) return;
    
    // Obtener la posición del planeta en el mundo 3D
    p.mesh.getWorldPosition(tempVector);
    
    // Proyectar coordenadas a 2D (-1 a +1)
    tempVector.project(camera);
    
    // Si queda detrás de la cámara, ocultarla
    if (tempVector.z > 1) {
      htmlEl.style.display = 'none';
      return;
    }
    
    // Convertir a píxeles de pantalla
    const screenX = (tempVector.x * 0.5 + 0.5) * width;
    const screenY = (tempVector.y * -0.5 + 0.5) * height;
    
    htmlEl.style.left = `${screenX}px`;
    htmlEl.style.top = `${screenY}px`;
    htmlEl.style.display = 'flex';
  });
}

// ==========================================================
// INTERACTIVIDAD DE CLICS Y HOVERS (ETIQUETAS)
// ==========================================================
const messageBalls = document.querySelectorAll('.message-ball');
const hoverParticleIntervals = new Map();

messageBalls.forEach(ball => {
  // Click en etiqueta abre el modal del planeta
  ball.addEventListener('click', () => {
    modalTitle.innerText = ball.dataset.title;
    modalText.innerText = ball.dataset.text;
    modalImg.src = ball.dataset.img;
    modal.classList.add('active');
  });
  
  // Hover: Agranda el planeta en 3D, hace girar la etiqueta y dispara partículas
  ball.addEventListener('mouseenter', () => {
    const planetObj = planetMap.get(ball);
    if (planetObj) {
      planetObj.isHovered = true;
    }
    
    // Partículas iniciales
    for (let i = 0; i < 6; i++) {
      createHoverParticle(ball);
    }
    
    // Flujo de partículas continuo
    const intervalId = setInterval(() => {
      createHoverParticle(ball);
    }, 140);
    hoverParticleIntervals.set(ball, intervalId);
  });
  
  // Fin de Hover: Restaura la escala normal del planeta 3D
  ball.addEventListener('mouseleave', () => {
    const planetObj = planetMap.get(ball);
    if (planetObj) {
      planetObj.isHovered = false;
    }
    
    if (hoverParticleIntervals.has(ball)) {
      clearInterval(hoverParticleIntervals.get(ball));
      hoverParticleIntervals.delete(ball);
    }
  });
});

// Función para crear partículas que flotan en pantalla
function createHoverParticle(ball) {
  const rect = ball.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const p = document.createElement('div');
  const types = ['❤️', '💖', '✨', '🌸', '💫'];
  p.innerText = types[Math.floor(Math.random() * types.length)];
  p.className = 'hover-particle';
  
  const spread = 15;
  const px = startX + (Math.random() - 0.5) * spread;
  const py = startY + (Math.random() - 0.5) * spread;
  
  p.style.left = px + 'px';
  p.style.top = py + 'px';
  
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * 65 + 40;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - 35;
  
  p.style.setProperty('--dx', dx + 'px');
  p.style.setProperty('--dy', dy + 'px');
  
  const size = Math.random() * 8 + 14; 
  p.style.fontSize = size + 'px';
  
  const duration = Math.random() * 0.6 + 0.8; 
  p.style.animationDuration = duration + 's';
  
  document.body.appendChild(p);
  
  setTimeout(() => {
    p.remove();
  }, duration * 1000);
}

closeModalBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

// ==========================================================
// TRANSICIÓN INTERACTIVA AL HACER CLIC EN "INICIAR VIAJE"
// ==========================================================
let isTransitioning = false;

startBtn.addEventListener('click', () => {
  if (isTransitioning) return;
  isTransitioning = true;
  
  // 0. Reproducir música de fondo automáticamente
  const travelMusic = document.getElementById('travel-music');
  if (travelMusic) {
    travelMusic.play().catch(err => {
      console.warn("La reproducción de música falló o fue bloqueada:", err);
    });
  }
  
  // 1. Ocultar el botón e interfaz HTML orbital
  gsap.to(startBtn, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => { startBtn.style.display = 'none'; }
  });
  
  gsap.to(orbitingMessages, {
    opacity: 0,
    duration: 0.8,
    pointerEvents: 'none'
  });
  
  // 2. Vuelo de aproximación lento a la Tierra (Lerp de la cámara)
  const earth = planets[2]; // Tierra
  const startCameraPos = camera.position.clone();
  
  const transitionProgress = { t: 0 };
  
  gsap.to(transitionProgress, {
    t: 1.0,
    duration: 3.5, // Más lento y cinemático
    ease: 'power2.inOut',
    onUpdate: () => {
      const t = transitionProgress.t;
      
      // Obtener posición actual de la Tierra en el mundo 3D
      const earthPos = new THREE.Vector3();
      earth.mesh.getWorldPosition(earthPos);
      
      // Posición objetivo extremadamente cercana para simular entrar a la atmósfera
      const targetCamPos = earthPos.clone().add(new THREE.Vector3(0, 0.4, 1.0));
      
      // Interpolar posición de la cámara
      camera.position.lerpVectors(startCameraPos, targetCamPos, t);
      
      // Apuntar la cámara de forma dinámica
      const lookTarget = new THREE.Vector3(0, 0, 0);
      lookTarget.lerp(earthPos, t);
      camera.lookAt(lookTarget);
      
      // Efecto atmosférico de entrada a las nubes (celeste cielo)
      const dist = camera.position.distanceTo(earthPos);
      if (dist < 4.5) {
        // Opacidad de neblina progresiva entre dist=4.5 y dist=1.1
        const opacity = Math.max(0, Math.min(1.0, (4.5 - dist) / 3.4));
        fadeOverlay.style.backgroundColor = '#e0f2f1'; // Celeste claro nube
        fadeOverlay.style.opacity = opacity;
      } else {
        fadeOverlay.style.opacity = 0;
      }
    }
  });
  
  // Acelerar exponencialmente el starfield a 38x
  gsap.to({ speed: 1.0 }, {
    speed: 38.0,
    duration: 3.2,
    ease: 'power2.in',
    onUpdate: function() {
      starSpeedMultiplier = this.targets()[0].speed;
    }
  });
  
  // 3. Transicionar al video final tras atravesar las nubes
  gsap.delayedCall(3.5, () => {
    // Detener bucle de renderizado 3D
    cancelAnimationFrame(animationFrameId);
    canvas.style.display = 'none';
    
    // Restaurar color blanco del overlay para el desvanecimiento de revelación
    fadeOverlay.style.backgroundColor = '#ffffff';
    
    // Mostrar y reproducir el video cinemático silenciado
    finalVideo.muted = true;
    finalVideo.style.opacity = '1';
    finalVideo.play();
    
    let particlesStarted = false;
    const letterContainer = document.getElementById('letter-container');
    
    // Emitter de corazones/mariposas en la carta final
    function createFinalParticle(type) {
      if (!letterContainer) return;
      const p = document.createElement('div');
      p.innerText = type === 'heart' ? '❤️' : '🦋';
      p.className = type === 'heart' ? 'heart-particle' : 'butterfly-particle';
      p.style.left = Math.random() * 95 + 'vw';
      
      if (type === 'butterfly') {
        p.style.setProperty('--dir', Math.random() > 0.5 ? 1 : -1);
        p.style.animationDuration = (Math.random() * 4 + 5) + 's';
        p.style.fontSize = (Math.random() * 20 + 20) + 'px';
      } else {
        p.style.animationDuration = (Math.random() * 3 + 4) + 's';
        p.style.fontSize = (Math.random() * 15 + 15) + 'px';
      }
      
      letterContainer.appendChild(p);
      setTimeout(() => p.remove(), 9000);
    }
    
    finalVideo.addEventListener('timeupdate', () => {
      if (finalVideo.currentTime >= 35.47 && !particlesStarted) {
        particlesStarted = true;
        
        if (letterContainer) {
          letterContainer.style.opacity = '1';
          letterContainer.style.pointerEvents = 'auto';
        }
        
        // Explosión de partículas inicial
        for (let i = 0; i < 30; i++) {
          setTimeout(() => createFinalParticle(Math.random() > 0.3 ? 'heart' : 'butterfly'), Math.random() * 2000);
        }
        
        // Flujo contínuo
        setInterval(() => {
          createFinalParticle(Math.random() > 0.3 ? 'heart' : 'butterfly');
        }, 300);
      }
    });
  });
  
  // Desvanecer destello revelando el video de la carta
  gsap.to(fadeOverlay, {
    opacity: 0,
    duration: 1.8,
    delay: 3.6,
    ease: 'power2.out'
  });
});

// ==========================================================
// RESIZE DE VENTANA
// ==========================================================
window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================================
// BUCLE DE RENDERIZADO Y ANIMACIÓN
// ==========================================================
let animationFrameId;
const startTime = performance.now();
let lastTime = performance.now();

function tick() {
  const currentTime = performance.now();
  const elapsedTime = (currentTime - startTime) * 0.001;
  const timeDelta = (currentTime - lastTime) * 0.001;
  lastTime = currentTime;
  
  // 1. Actualizar posiciones orbitales de planetas
  updatePlanets(elapsedTime);
  
  // 2. Animar estrellas, meteoritos y cometas
  animateStars();
  animateMeteorites();
  animateComets();
  
  // 3. Proyectar etiquetas HTML en la pantalla 2D
  projectPlanetsToScreen();
  
  // 4. Pulso suave del Sol central
  const sunPulse = 1.0 + Math.sin(elapsedTime * 3) * 0.04;
  sunMesh.scale.set(sunPulse, sunPulse, sunPulse);
  sunGlowMesh.scale.set(sunPulse * 1.15, sunPulse * 1.15, sunPulse * 1.15);
  
  // Rotación leve del sol
  sunMesh.rotation.y += 0.003;
  
  // 5. Renderizar escena
  renderer.render(scene, camera);
  
  animationFrameId = requestAnimationFrame(tick);
}

// Iniciar bucle
tick();

// Funciones helpers de soporte
function updatePlanets(time) {
  planets.forEach((p, idx) => {
    // Si está hovered, se detiene la órbita de ese planeta para facilitar el click
    if (!p.isHovered) {
      p.angle += p.config.speed * 0.009;
    }
    
    // Inclinación orbital tridimensional única
    const tiltAmount = 0.12; 
    const rawX = Math.cos(p.angle) * p.config.orbitRadius;
    const rawZ = Math.sin(p.angle) * p.config.orbitRadius;
    
    p.mesh.position.x = rawX;
    p.mesh.position.z = rawZ;
    // Inclinación y balanceo alternado
    p.mesh.position.y = Math.sin(p.angle) * p.config.orbitRadius * tiltAmount * (idx % 2 === 0 ? 1 : -1);
    
    // Auto-rotación del planeta sobre su propio eje
    if (p.config.texture === '/tierra.jpg' && p.mesh.userData && p.mesh.userData.surface) {
      p.mesh.userData.surface.rotation.y += 0.006;
      p.mesh.userData.clouds.rotation.y += 0.0085; // Las nubes giran más rápido
    } else {
      p.mesh.rotation.y += 0.008;
    }
    
    // Satélite girando en órbita alrededor de su planeta
    const satAngle = time * 2.2 + idx;
    p.satellite.position.set(
      Math.cos(satAngle) * (p.config.size * 1.6),
      Math.sin(satAngle) * 0.4,
      Math.sin(satAngle) * (p.config.size * 1.6)
    );
    
    // Interpolación para escala (Hover Zoom suave)
    p.targetScale = p.isHovered ? 1.45 : 1.0;
    p.currentScale += (p.targetScale - p.currentScale) * 0.15;
    p.mesh.scale.set(p.currentScale, p.currentScale, p.currentScale);
  });
}
