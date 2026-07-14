import * as THREE from 'three';
import { gsap } from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import './style.css';
const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.01, 2000);

const isMobile = window.innerWidth < 768;
// Alejar la cámara para que toda la galaxia sea visible y no se corte
camera.position.set(0, isMobile ? 45 : 30, isMobile ? 70 : 60);
// La cámara apuntará al centro (Sol) inicialmente
camera.lookAt(0, 0, 0);
scene.add(camera);

// Eliminamos OrbitControls para tener control total cinematográfico
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(sizes.width, sizes.height), 1.2, 0.4, 0.95); // Umbral alto para que las imágenes blancas no brillen
const composer = new EffectComposer(renderer);
// CORRECCIÓN VITAL: El Composer debe usar el PixelRatio del dispositivo, si no, todo se renderiza borroso
if (composer.setPixelRatio) {
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
} else {
    composer.setSize(sizes.width * Math.min(window.devicePixelRatio, 2), sizes.height * Math.min(window.devicePixelRatio, 2));
}
composer.addPass(renderScene);
composer.addPass(bloomPass);

const textureLoader = new THREE.TextureLoader();

// GRUPOS PRINCIPALES
const spaceGroup = new THREE.Group();
scene.add(spaceGroup);

const surfaceGroup = new THREE.Group();
surfaceGroup.visible = false;
scene.add(surfaceGroup);

// ==========================================
// FASE 1: EL ESPACIO (SISTEMA SOLAR)
// ==========================================
const galaxyGeometry = new THREE.PlaneGeometry(200, 100);
const galaxyMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load('https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/NGC_4414_%28NASA-med%29.jpg/1024px-NGC_4414_%28NASA-med%29.jpg'),
    transparent: true, opacity: 0.6, depthWrite: false
});
const galaxyBg = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
galaxyBg.position.set(0, -10, -50); 
spaceGroup.add(galaxyBg);

// Capa 1: Estrellas blancas rápidas (warp)
const starsGeo = new THREE.BufferGeometry();
const STAR_COUNT = 4000;
const starsPos = new Float32Array(STAR_COUNT * 3);
const starsSizes = new Float32Array(STAR_COUNT);
for(let i=0; i<STAR_COUNT; i++) {
    starsPos[i*3]   = (Math.random() - 0.5) * 250;
    starsPos[i*3+1] = (Math.random() - 0.5) * 250;
    starsPos[i*3+2] = (Math.random() - 0.5) * 250;
    starsSizes[i] = Math.random() * 0.15 + 0.03;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
starsGeo.setAttribute('size', new THREE.BufferAttribute(starsSizes, 1));
const starsMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.1, transparent: true, opacity: 0.85, sizeAttenuation: true});
spaceGroup.add(new THREE.Points(starsGeo, starsMat));

// Capa 2: Polvo cósmico de colores (partículas pequeñas de color)
const dustGeo = new THREE.BufferGeometry();
const DUST_COUNT = 2000;
const dustPos = new Float32Array(DUST_COUNT * 3);
const dustColors = new Float32Array(DUST_COUNT * 3);
const dustPalette = [
    [0.3, 0.7, 1.0],  // Azul cielo
    [1.0, 0.4, 0.8],  // Rosa
    [0.5, 0.2, 1.0],  // Púrpura
    [1.0, 0.8, 0.3],  // Dorado
    [0.2, 1.0, 0.6],  // Verde esmeralda
];
for(let i=0; i<DUST_COUNT; i++) {
    dustPos[i*3]   = (Math.random() - 0.5) * 300;
    dustPos[i*3+1] = (Math.random() - 0.5) * 200;
    dustPos[i*3+2] = (Math.random() - 0.5) * 300;
    const c = dustPalette[Math.floor(Math.random() * dustPalette.length)];
    dustColors[i*3]   = c[0];
    dustColors[i*3+1] = c[1];
    dustColors[i*3+2] = c[2];
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
const dustMat = new THREE.PointsMaterial({size: 0.08, transparent: true, opacity: 0.6, vertexColors: true, sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false});
spaceGroup.add(new THREE.Points(dustGeo, dustMat));

// Capa 3: Nubes de Nebulosa (planos translúcidos con gradientes radiales)
function createNebulaCloud(color, size, pos) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, color.replace('0.35', '0.15'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide})
    );
    mesh.position.copy(pos);
    mesh.lookAt(camera.position);
    return mesh;
}

const nebulaData = [
    { color: 'rgba(100, 0, 255, 0.35)', size: 80, pos: new THREE.Vector3(-60, 20, -100) },
    { color: 'rgba(255, 50, 150, 0.35)', size: 100, pos: new THREE.Vector3(70, -15, -130) },
    { color: 'rgba(0, 180, 255, 0.35)', size: 70, pos: new THREE.Vector3(0, 30, -160) },
    { color: 'rgba(255, 150, 0, 0.35)', size: 60, pos: new THREE.Vector3(-80, -25, -90) },
];
const nebulaClouds = [];
nebulaData.forEach(n => {
    const cloud = createNebulaCloud(n.color, n.size, n.pos);
    spaceGroup.add(cloud);
    nebulaClouds.push(cloud);
});

// Capa 4: Estrellas Fugaces (shooting stars con estela brillante)
const shootingStarsData = [];
function createShootingStar() {
    const lineGeo = new THREE.BufferGeometry();
    const points = [];
    for(let i=0; i<20; i++) {
        points.push(0, 0, -i * 0.8); // Estela de 16 unidades de largo
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const lineMat = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending});
    const line = new THREE.Line(lineGeo, lineMat);
    line.position.set(
        (Math.random() - 0.5) * 160,
        (Math.random() - 0.5) * 100,
        -80 - Math.random() * 200
    );
    // Dirección diagonal aleatoria
    const dirX = (Math.random() - 0.5) * 2;
    const dirY = (Math.random() - 0.5) * 1;
    spaceGroup.add(line);
    return { mesh: line, speed: 2 + Math.random() * 3, dirX, dirY, life: 0, maxLife: 60 + Math.random() * 120 };
}
for(let i=0; i<8; i++) {
    shootingStarsData.push(createShootingStar());
}

// Interactividad: Parallax con el mouse
const mouseTarget = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
    mouseTarget.x = (e.clientX / sizes.width - 0.5) * 2;
    mouseTarget.y = (e.clientY / sizes.height - 0.5) * 2;
});

// --- ELEMENTOS DE ALTA VELOCIDAD (Warp Speed) ---
const meteorsData = [];
const passingPlanetsData = [];

// Geometría y material base para meteoritos
const meteorGeo = new THREE.IcosahedronGeometry(0.4, 0); // Roca irregular
const meteorMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9, flatShading: true });
const fireGeo = new THREE.ConeGeometry(0.4, 3, 8);
fireGeo.translate(0, 1.5, 0); // Mover pivote a la base
fireGeo.rotateX(-Math.PI / 2); // Apuntar la cola hacia atrás (-Z)
const fireMat = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });

for(let i=0; i<25; i++) {
    const meteorGroup = new THREE.Group();
    const rock = new THREE.Mesh(meteorGeo, meteorMat);
    const fire = new THREE.Mesh(fireGeo, fireMat);
    meteorGroup.add(rock);
    meteorGroup.add(fire);
    
    meteorGroup.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80,
        -100 - Math.random() * 300
    );
    
    const speed = 1.0 + Math.random() * 2.0; // Muy rápidos
    const rotSpeed = new THREE.Vector3(Math.random()*0.1, Math.random()*0.1, Math.random()*0.1);
    
    spaceGroup.add(meteorGroup);
    meteorsData.push({ group: meteorGroup, rock: rock, fire: fire, speed: speed, rotSpeed: rotSpeed });
}

// Elementos decorativos Pasantes: ESTILO NEON (Reducidos y más variados)
const neonShapesData = [];
const neonColors = [0x00ffff, 0xff00ff, 0xffff00, 0xff4400, 0x00ffaa, 0x8844ff, 0xff2288];

for(let i=0; i<7; i++) {
    const color = neonColors[i % neonColors.length];
    const g = new THREE.Group();
    
    // Núcleo brillante
    const coreSize = 1.0 + Math.random() * 2.5;
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(coreSize, 24, 24),
        new THREE.MeshBasicMaterial({color: color})
    );
    g.add(core);
    
    // Halo de resplandor (esfera más grande y translúcida)
    const halo = new THREE.Mesh(
        new THREE.SphereGeometry(coreSize * 2.5, 16, 16),
        new THREE.MeshBasicMaterial({color: color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false})
    );
    g.add(halo);
    
    // Anillo solo para algunos
    if (i % 3 === 0) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(coreSize * 2, 0.15, 12, 48),
            new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.7})
        );
        ring.rotation.x = Math.PI / 2 + Math.random() * 0.5;
        g.add(ring);
    }
    
    g.position.set(
        (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 90), 
        (Math.random() - 0.5) * 60,
        -150 - Math.random() * 400
    );
    
    spaceGroup.add(g);
    neonShapesData.push({ mesh: g, speed: 0.6 + Math.random() * 1.0, pulseOffset: Math.random() * Math.PI * 2, halo: halo, core: core });
}

const solarSystemGroup = new THREE.Group();
spaceGroup.add(solarSystemGroup);

const sun = new THREE.Mesh(new THREE.SphereGeometry(2.5, 64, 64), new THREE.MeshBasicMaterial({ color: 0xffddaa }));
solarSystemGroup.add(sun);
solarSystemGroup.add(new THREE.PointLight(0xffffff, 3, 100));
solarSystemGroup.add(new THREE.AmbientLight(0xffffff, 0.2));

const planetsData = [];
const createPlanet = (name, radius, distance, textureUrl, color = 0xffffff, hasRing = false) => {
    const orbit = new THREE.Mesh(new THREE.RingGeometry(distance, distance + 0.05, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.15 }));
    orbit.rotation.x = Math.PI / 2;
    solarSystemGroup.add(orbit);

    const planetGroup = new THREE.Group();
    planetGroup.position.x = distance;
    
    let matProps = { roughness: 0.6 };
    if(textureUrl) matProps.map = textureLoader.load(textureUrl);
    else matProps.color = color;
    
    const planetMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), new THREE.MeshStandardMaterial(matProps));
    
    if (hasRing) {
        const pRing = new THREE.Mesh(new THREE.RingGeometry(radius * 1.4, radius * 2.2, 64), new THREE.MeshBasicMaterial({ 
            map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_ring_alpha.png'),
            color: 0xd2b48c, side: THREE.DoubleSide, transparent: true, opacity: 0.8
        }));
        pRing.rotation.x = Math.PI / 2 + 0.2;
        planetGroup.add(pRing);
    }
    
    planetGroup.add(planetMesh);

    const orbitContainer = new THREE.Group();
    orbitContainer.add(planetGroup);
    orbitContainer.rotation.y = Math.random() * Math.PI * 2;
    solarSystemGroup.add(orbitContainer);

    planetsData.push({ name, mesh: planetMesh, group: planetGroup, orbitContainer, distance, radius });
    return { planetGroup, planetMesh, orbitContainer };
};

const textureBase = 'https://raw.githubusercontent.com/SoumyaEXE/3d-Solar-System-ThreeJS/master/public/textures/';

createPlanet('Mercury', 0.2, 5, textureBase + 'mercury.jpg');
createPlanet('Venus', 0.4, 7, textureBase + 'venus.jpg');

const earthData = createPlanet('Earth', 0.6, 9.5, textureBase + 'earth.jpg');
const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(0.61, 64, 64), new THREE.MeshStandardMaterial({
    map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
    transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false
}));
earthData.planetGroup.add(cloudMesh);

createPlanet('Mars', 0.3, 12, textureBase + 'mars.jpg');
createPlanet('Jupiter', 1.4, 16, textureBase + 'jupiter.jpg'); 
createPlanet('Saturn', 1.1, 21, textureBase + 'saturn.jpg', 0xffffff, true); // Usa anillo por defecto
createPlanet('Uranus', 0.7, 25, textureBase + 'uranus.jpg');
createPlanet('Neptune', 0.7, 29, textureBase + 'neptune.jpg');

// --- ESFERAS DE MENSAJES (Bolas Flotantes) ---
const messageGroup = new THREE.Group();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let messageSprites = [];

const messagesData = [
    { 
        title: "🌹 Amoréa", 
        text: "El planeta donde nacen los sentimientos más puros del universo. Aquí el aire respira pasión y cada latido del corazón resuena con la fuerza de un amor infinito. En este mundo, nuestras miradas se cruzaron por primera vez y el destino quedó sellado. Un lugar donde siempre florece la ternura y la promesa de estar juntos para siempre."
    },
    { 
        title: "✨ Lunaria", 
        text: "Un mundo iluminado por una luna eterna donde viven las promesas de amor. Bajo su luz plateada, nuestros secretos más profundos y nuestros sueños más dulces toman forma. Es el refugio donde el tiempo se detiene para dejarnos disfrutar de cada abrazo. Una luna que es testigo de que este sentimiento jamás conocerá el final."
    },
    { 
        title: "💫 Eternia", 
        text: "El planeta donde el amor no conoce el tiempo ni la distancia. Aquí comprendí que no importa lo lejos que estemos, nuestras almas siempre encontrarán el camino de regreso. Cada estrella en su cielo representa un recuerdo hermoso que hemos construido juntos. Este es nuestro universo privado, donde siempre seremos infinitos."
    },
    { 
        title: "❤️ Valenthera", 
        text: "El planeta del corazón valiente, donde dos almas destinadas se encuentran. Aquí aprendimos a superar todos los miedos y a luchar con fuerza por lo que sentimos. En sus tierras, el amor es la única ley y la sinceridad nuestro escudo. Juntos hemos demostrado que no hay desafío en la galaxia que nuestro cariño no pueda vencer."
    },
    { 
        title: "🧿 Aurelia", 
        text: "Un planeta dorado donde cada estrella guarda una historia de amor. Su brillo refleja la inmensa felicidad que me da despertar pensando en ti cada mañana. Caminar por sus senderos de luz es como navegar por la paz que solo tus besos me pueden dar. Una obra de arte cósmica diseñada exclusivamente para celebrar nuestra unión."
    },
    { 
        title: "🌙 Serenova", 
        text: "El mundo de la paz, la calma y el amor verdadero. Cuando la vida se vuelve un caos, solo necesito pensar en este lugar para encontrar la tranquilidad en tus brazos. Es el oasis donde nuestras diferencias se disuelven y solo queda la comprensión absoluta. Aquí nuestro amor crece sano, libre, fuerte y sereno como el universo."
    },
    { 
        title: "💎 Celestia", 
        text: "Un planeta celestial donde las almas conectadas por el destino se encuentran. Su atmósfera está llena de destellos que me recuerdan al brillo de tus ojos cuando sonríes. Este es el rincón sagrado donde prometimos cuidarnos en cada vida y en cada realidad. Nuestro amor es la joya más brillante y preciada de toda la creación."
    }
];

// URLs de las imágenes subidas por el usuario
const bearImages = ['/bear_1.png', '/bear_2.png', '/bear_3.png', '/bear_4.png'];

// Función para cargar una imagen, hacerla circular y dibujarle el título abajo
function createMessageTexture(data, imgUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = imgUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024; // Potencia de 2 (Power of Two) para texturas perfectas en WebGL
            canvas.height = 2048; 
            const ctx = canvas.getContext('2d');
            
            // Recorte circular de la imagen en la parte superior
            ctx.save();
            ctx.beginPath();
            ctx.arc(512, 512, 480, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            // Para evitar que la imagen original se pixele al estirarse, suavizamos
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 32, 32, 960, 960);
            ctx.restore();
            
            // Borde brillante romántico
            ctx.beginPath();
            ctx.arc(512, 512, 480, 0, Math.PI * 2);
            ctx.lineWidth = 30;
            ctx.strokeStyle = '#ff66b2';
            ctx.stroke();
            
            // Dibujar el título del planeta debajo de la imagen
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 200px "Cinzel", serif, Arial'; // Texto inmenso
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            
            // Sombra pesada para que el texto resalte sobre el espacio
            ctx.shadowColor = 'rgba(0, 0, 0, 1)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetX = 8;
            ctx.shadowOffsetY = 8;
            
            ctx.fillText(data.title, 512, 1050);
            
            const tex = new THREE.CanvasTexture(canvas);
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Filtro anisotrópico para ultra nitidez
            tex.colorSpace = THREE.SRGBColorSpace;
            
            resolve({ texture: tex, src: imgUrl, data: data });
        };
    });
}

// Cargar todas las texturas y luego crear los sprites
const spritePromises = messagesData.map((data, index) => {
    return createMessageTexture(data, bearImages[index % 4]);
});

Promise.all(spritePromises).then((texturesData) => {
    texturesData.forEach((textureObj, index) => {
        // Oscurecemos el sprite un 5% (0xeeeeee) para que no supere el umbral de Bloom (0.95)
        const mat = new THREE.SpriteMaterial({ map: textureObj.texture, color: 0xeeeeee });
        const sprite = new THREE.Sprite(mat);
        
        // Posición calculada matemáticamente para no salirse de la galaxia y no apilarse
        const angle = (index / texturesData.length) * Math.PI * 2;
        // Distancias fijas intercaladas exactamente entre los planetas
        const fixedRadii = [6, 8.5, 11.5, 14, 18.5, 23, 27];
        const radius = fixedRadii[index % fixedRadii.length];
        
        sprite.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 6, // Altura aleatoria suave para que no queden todas en el mismo plano 2D
            Math.sin(angle) * radius
        );
        
        // Tamaño de la bolita: Ajustado para mantener proporción 1024x2048
        // Ancho = 1024/2048 * Alto (es decir, la mitad del alto)
        sprite.scale.set(3.5, 7.0, 1);
        
        // Guardar datos en el sprite para el clic
        sprite.userData = { 
            title: textureObj.data.title,
            message: textureObj.data.text, 
            angleOffset: angle, 
            radius: radius, 
            speed: 0.8, // VELOCIDAD FIJA para que todas giren juntas y NUNCA se alcancen ni apilen
            imgSrc: textureObj.src
        };
        
        messageGroup.add(sprite);
        messageSprites.push(sprite);
    });
});

spaceGroup.add(messageGroup);

// --- INTERACCIÓN DE CLICS (Raycaster) ---
const modal = document.getElementById('message-modal');
const modalText = document.getElementById('modal-text');
const closeModalBtn = document.getElementById('close-modal');

window.addEventListener('pointerdown', (event) => {
    // Si la galaxia ya no es visible o el botón Iniciar no está, ignorar clics
    if (!spaceGroup.visible) return;
    
    // Convertir coordenadas del ratón a espacio normalizado (-1 a +1)
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(pointer, camera);
    
    // Buscar intersecciones con las esferas
    const intersects = raycaster.intersectObjects(messageGroup.children);
    
    if (intersects.length > 0) {
        const clickedSprite = intersects[0].object;
        document.getElementById('modal-title').innerText = clickedSprite.userData.title;
        modalText.innerText = clickedSprite.userData.message;
        document.getElementById('modal-img').src = clickedSprite.userData.imgSrc;
        modal.classList.add('active');
    }
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// ==========================================
// FASE 2: ELIMINADA (AHORA USAMOS VIDEO)
// ==========================================


// --- 4. ANIMACION Y VIAJE CINEMÁTICO (WHEEL/TOUCH) ---
const clock = new THREE.Clock();

// Objeto falso para simular el target de la cámara
const cameraTarget = new THREE.Vector3(0, 0, 0);

// Variable para detener las órbitas cuando se hace zoom
let isOrbiting = true;

// EVENTO CLICK DEL BOTÓN
const startBtn = document.getElementById('start-btn') || document.querySelector('.start-btn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        // Detener las órbitas para que la cámara no persiga a un planeta en movimiento
        isOrbiting = false;
        
        // Ocultar botón
        gsap.to(startBtn, { opacity: 0, duration: 0.5, onComplete: () => startBtn.style.display = 'none' });
        
        // Ocultar mensajes si están visibles
        if (typeof messagesData !== 'undefined') {
            messagesData.forEach(m => {
                if(m.htmlElement) m.htmlElement.style.opacity = '0';
            });
        }
        
        // Obtener la posición exacta de la Tierra en este momento
        scene.updateMatrixWorld(true);
        const currentEarthPos = new THREE.Vector3();
        if (typeof earthData !== 'undefined' && earthData.planetMesh) {
            earthData.planetMesh.getWorldPosition(currentEarthPos);
        }

        // Crear la línea de tiempo dinámicamente con la posición actual
        const tl = gsap.timeline();

        // 1. Acercarse a la Tierra (Vista General)
        tl.to(camera.position, {
            y: 2, z: currentEarthPos.z + 8, x: currentEarthPos.x + 3,
            duration: 3, ease: 'power2.inOut'
        }, 0);
        tl.to(cameraTarget, {
            x: currentEarthPos.x, y: currentEarthPos.y, z: currentEarthPos.z,
            duration: 3, ease: 'power2.inOut'
        }, 0);

        // 2. Zoom extremo hasta tocar las nubes
        tl.to(camera.position, {
            x: currentEarthPos.x, y: currentEarthPos.y, z: currentEarthPos.z + 0.65,
            duration: 2.5, ease: 'power3.in'
        }, 3);

        // 3. Destello blanco inmenso
        tl.to('#fade-overlay', { opacity: 1, duration: 0.5, ease: 'power2.in' }, 5);

        // 4. Cambio de escena a VIDEO
        tl.call(() => {
            // Apagar el renderizador 3D y ocultar el canvas
            const webglEl = document.querySelector('#webgl');
            if (webglEl) webglEl.style.opacity = '0';
            spaceGroup.visible = false;
            
            // Mostrar y reproducir el video a pantalla completa
            const video = document.getElementById('final-video');
            if (video) {
                video.style.opacity = '1';
                video.play();

                // Variables para el control de partículas
                let particlesStarted = false;
                const letterContainer = document.getElementById('letter-container');

                // Función para crear una partícula (Corazón o Mariposa)
                function createParticle(type) {
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

                // Escuchar el tiempo del video para mostrar la carta y lanzar partículas
                video.addEventListener('timeupdate', () => {
                    if (video.currentTime >= 35.47 && !particlesStarted) {
                        particlesStarted = true;
                        
                        if (letterContainer) {
                            letterContainer.style.opacity = '1';
                            letterContainer.style.pointerEvents = 'auto'; // Permitir hacer clic
                        }

                        // Lanzar lluvia intensa inicial
                        for(let i=0; i<30; i++) {
                            setTimeout(() => createParticle(Math.random() > 0.3 ? 'heart' : 'butterfly'), Math.random() * 2000);
                        }

                        // Continuar lanzando partículas suavemente
                        setInterval(() => {
                            createParticle(Math.random() > 0.3 ? 'heart' : 'butterfly');
                        }, 300);
                    }
                });
            }
        }, null, 5.5);

        // 5. Desvanecer destello para revelar el video
        tl.to('#fade-overlay', { opacity: 0, duration: 2.0, ease: 'power2.out' }, 5.6);
    });
}

function tick() {
    const elapsedTime = clock.getElapsedTime();
    
    if (spaceGroup.visible && isOrbiting) {
        // Efecto de avance a través del espacio (Warp Effect) Acelerado
        const positions = starsGeo.attributes.position.array;
        for (let i = 0; i < STAR_COUNT; i++) {
            positions[i * 3 + 2] += 0.6;
            if (positions[i * 3 + 2] > 100) {
                positions[i * 3 + 2] -= 250; 
            }
        }
        starsGeo.attributes.position.needsUpdate = true;

        // Polvo cósmico de colores también avanza
        const dPos = dustGeo.attributes.position.array;
        for (let i = 0; i < DUST_COUNT; i++) {
            dPos[i * 3 + 2] += 0.3;
            if (dPos[i * 3 + 2] > 100) dPos[i * 3 + 2] -= 300;
        }
        dustGeo.attributes.position.needsUpdate = true;

        // Nubes de nebulosa pulsan suavemente (respiran)
        nebulaClouds.forEach((cloud, i) => {
            const s = 1 + Math.sin(elapsedTime * 0.3 + i) * 0.08;
            cloud.scale.set(s, s, 1);
            cloud.lookAt(camera.position);
        });

        // Estrellas fugaces
        shootingStarsData.forEach((ss, idx) => {
            ss.mesh.position.x += ss.dirX * ss.speed;
            ss.mesh.position.y += ss.dirY * ss.speed;
            ss.mesh.position.z += ss.speed;
            ss.life++;
            ss.mesh.material.opacity = Math.max(0, 1 - ss.life / ss.maxLife);
            if (ss.life >= ss.maxLife) {
                // Reciclar estrella fugaz
                ss.mesh.position.set(
                    (Math.random() - 0.5) * 160,
                    (Math.random() - 0.5) * 100,
                    -80 - Math.random() * 200
                );
                ss.dirX = (Math.random() - 0.5) * 2;
                ss.dirY = (Math.random() - 0.5) * 1;
                ss.speed = 2 + Math.random() * 3;
                ss.life = 0;
                ss.maxLife = 60 + Math.random() * 120;
                ss.mesh.material.opacity = 0.9;
            }
        });

        // Animar meteoros
        meteorsData.forEach(m => {
            m.group.position.z += m.speed;
            m.rock.rotation.x += m.rotSpeed.x;
            m.rock.rotation.y += m.rotSpeed.y;
            m.fire.scale.x = 1 + Math.sin(elapsedTime * 30 + m.speed) * 0.3;
            m.fire.scale.y = 1 + Math.random() * 0.5;
            if (m.group.position.z > 80) {
                m.group.position.z = -150 - Math.random() * 200;
                m.group.position.x = (Math.random() - 0.5) * 120;
                m.group.position.y = (Math.random() - 0.5) * 80;
            }
        });

        // Animar figuras de neón con pulso de respiración
        neonShapesData.forEach(n => {
            n.mesh.position.z += n.speed;
            n.mesh.rotation.y += 0.008;
            // Pulso del halo (respira)
            if (n.halo) {
                const pulse = 1 + Math.sin(elapsedTime * 2 + n.pulseOffset) * 0.3;
                n.halo.scale.set(pulse, pulse, pulse);
                n.halo.material.opacity = 0.08 + Math.sin(elapsedTime * 3 + n.pulseOffset) * 0.06;
            }
            if (n.mesh.position.z > 80) {
                n.mesh.position.z = -250 - Math.random() * 300;
                n.mesh.position.x = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 90);
                n.mesh.position.y = (Math.random() - 0.5) * 60;
            }
        });
        
        // Rotar suavemente el fondo de la galaxia para dar dinamismo
        galaxyBg.rotation.z -= 0.0003;

        planetsData.forEach((pData, index) => {
            pData.orbitContainer.rotation.y += (0.002 - (index * 0.0002));
            pData.group.rotation.y += 0.01;
        });
        cloudMesh.rotation.y = elapsedTime * 0.1;
        
        // Mover esferas de mensajes alrededor del Sol
        messageSprites.forEach((sprite) => {
            sprite.userData.angleOffset += 0.0005 * sprite.userData.speed; // Reducida la velocidad de 0.005 a 0.0005
            sprite.position.x = Math.cos(sprite.userData.angleOffset) * sprite.userData.radius;
            sprite.position.z = Math.sin(sprite.userData.angleOffset) * sprite.userData.radius;
        });
    }

    // Parallax interactivo: la galaxia reacciona al movimiento del mouse
    if (spaceGroup.visible && isOrbiting && typeof mouseTarget !== 'undefined') {
        spaceGroup.rotation.y += (mouseTarget.x * 0.02 - spaceGroup.rotation.y) * 0.03;
        spaceGroup.rotation.x += (-mouseTarget.y * 0.01 - spaceGroup.rotation.x) * 0.03;
    }

    camera.lookAt(cameraTarget);
    composer.render();
    window.requestAnimationFrame(tick);
};

// VITAL: Escuchar cambios de tamaño de ventana para evitar gráficos estirados y borrosos
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Actualizar cámara
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Actualizar renderer y composer manteniendo alta definición
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(sizes.width, sizes.height);
    if (composer.setPixelRatio) {
        composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
});

tick();


