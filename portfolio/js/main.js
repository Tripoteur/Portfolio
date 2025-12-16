import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- SCENE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0x333333); // Removed to allow video background

// Caméra
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1, 5); // Reculée de 5 unités

// Rendu
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- LUMIERES (Très fortes pour être sûr de voir) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(2, 5, 2);
scene.add(dirLight);

// --- CHARGEMENT MODELE ---
let ocModel;
const loader = new GLTFLoader();

loader.load(
    './assets/models/oc.glb',
    (gltf) => {
        console.log("📦 Modèle chargé !");
        ocModel = gltf.scene;

        // 1. CENTRAGE ET REDIMENSIONNEMENT AUTOMATIQUE (Magie !)
        const box = new THREE.Box3().setFromObject(ocModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // On compense le décalage pour le centrer parfaitement
        ocModel.position.x += (ocModel.position.x - center.x);
        ocModel.position.y += (ocModel.position.y - center.y);
        ocModel.position.z += (ocModel.position.z - center.z);

        // On calcule un facteur d'échelle pour qu'il fasse 2 unités de haut
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        ocModel.scale.set(scale, scale, scale);

        console.log(`📏 Redimensionné avec un facteur de : ${scale}`);

        // 2. GESTION ANIMATIONS (Sécurité)
        const animations = gltf.animations;
        if (animations && animations.length > 0) {
            console.log(`🎬 ${animations.length} animations trouvées.`);
            // Code pour jouer l'anim ici si besoin
        } else {
            console.warn("⚠️ AUCUNE ANIMATION trouvée dans le fichier .glb");
        }

        scene.add(ocModel);
    },
    undefined,
    (error) => console.error(error)
);

// --- LOOP ---
// --- PROCEDURAL SHAPES GENERATION ---
const shapesGroup = new THREE.Group();
scene.add(shapesGroup);

const geometryTypes = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.IcosahedronGeometry(0.8),
    new THREE.OctahedronGeometry(1)
];

const materialWireframe = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.1
});

const particleCount = 20;

for (let i = 0; i < particleCount; i++) {
    const randomGeo = geometryTypes[Math.floor(Math.random() * geometryTypes.length)];
    const mesh = new THREE.Mesh(randomGeo, materialWireframe);

    // Position aleatoire autour du centre
    const spread = 15;
    mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
    );

    // Rotation aleatoire
    mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );

    // Scale aleatoire
    const scale = Math.random() * 0.5 + 0.5;
    mesh.scale.set(scale, scale, scale);

    shapesGroup.add(mesh);
}


// --- INTERACTION (RAYCASTING & DRAG) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
const rotationSpeed = 0.005;

// MOUSE EVENTS
document.addEventListener('mousedown', (e) => {
    // 1. Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // 2. Raycasting
    raycaster.setFromCamera(mouse, camera);

    // Check intersection with OC Model only
    if (ocModel) {
        const intersects = raycaster.intersectObjects([ocModel], true); // true = recursive for all child meshes

        if (intersects.length > 0) {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            document.body.style.cursor = 'grabbing'; // Visual feedback
        }
    }
});

document.addEventListener('mousemove', (e) => {
    if (isDragging && ocModel) {
        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        // Rotation X (Haut/Bas) and Y (Gauche/Droite)
        ocModel.rotation.y += deltaMove.x * rotationSpeed;
        ocModel.rotation.x += deltaMove.y * rotationSpeed;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'default';
});

// TOUCH EVENTS (Simplified Raycasting for touch is tricky, usually just drag is fine broadly or we map touch to mouse)
// For now, we keep the global touch drag for mobile usability, assuming the user taps the screen center mostly.
// But let's try to be consistent if possible.
document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    if (ocModel) {
        const intersects = raycaster.intersectObjects([ocModel], true);
        if (intersects.length > 0) {
            isDragging = true;
            previousMousePosition = { x: touch.clientX, y: touch.clientY };
        }
    }
});

document.addEventListener('touchmove', (e) => {
    if (isDragging && ocModel) {
        const touch = e.touches[0];
        const deltaMove = {
            x: touch.clientX - previousMousePosition.x,
            y: touch.clientY - previousMousePosition.y
        };

        ocModel.rotation.y += deltaMove.x * rotationSpeed;
        ocModel.rotation.x += deltaMove.y * rotationSpeed;

        previousMousePosition = { x: touch.clientX, y: touch.clientY };
    }
});

document.addEventListener('touchend', () => {
    isDragging = false;
});


// --- LOOP & SCROLL ---
let scrollY = 0;

function animate() {
    requestAnimationFrame(animate);

    // Animation de l'OC
    if (ocModel) {
        // Oscillation légère
        ocModel.position.y += Math.sin(Date.now() * 0.001) * 0.001; // Reduced amplitude slightly
    }

    // Animation des formes (Fond)
    shapesGroup.rotation.y = scrollY * 0.0005;
    shapesGroup.rotation.x = scrollY * 0.0002;

    shapesGroup.children.forEach((child, i) => {
        child.rotation.x += 0.01;
        child.rotation.y += 0.01;
    });

    // --- SCROLL ZOOM EFFECT ---
    // Camera moves closer as we scroll down
    // Base position is z=5. We want to go to maybe z=3 at max scroll.
    const zoomFactor = 0.003;
    const targetZ = 5 - (scrollY * zoomFactor);
    // Clamp to avoid going through the model or too far
    camera.position.z = Math.max(2, targetZ);

    // Parallax on Y as well (Camera moves UP so object appears to go DOWN, staying on screen)
    // Reduced factor to 0.0005 so it doesn't leave the screen too fast
    camera.position.y = 0 + (scrollY * 0.00005);

    renderer.render(scene, camera);
}
animate();

// Scroll Listener
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

const typebotInitScript = document.createElement("script");
typebotInitScript.type = "module";
typebotInitScript.innerHTML = `import Typebot from 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js'

Typebot.initBubble({
  typebot: "basic-chat-gpt-8nzedje",
  theme: {
    placement: "left",
    button: {
      backgroundColor: "transparent",
      customIconSrc:
        "https://s3.typebot.io/public/workspaces/cmirrtdmv001hld04qy5ef6i4/typebots/bo0mi0mr9a5i34ryr8nzedje/bubble-icon?v=1765722755707",
    },
    chatWindow: { backgroundColor: "#110C0A" },
  },
});
`;
document.body.append(typebotInitScript);


// --- LIGHTBOX LOGIC ---
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
const lbDesc = document.getElementById('lb-desc');
const closeBtn = document.querySelector('.lightbox-close');

// Open
document.querySelectorAll('.project-item').forEach(item => {
    item.addEventListener('click', () => {
        const img = item.querySelector('img');
        const title = item.dataset.title;
        const desc = item.dataset.desc;

        lbImg.src = img.src;
        lbTitle.textContent = title;
        lbDesc.textContent = desc;

        lightbox.classList.remove('hidden');
    });
});

// Close
closeBtn.addEventListener('click', () => {
    lightbox.classList.add('hidden');
});

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        lightbox.classList.add('hidden');
    }
});

// Escape Key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
        lightbox.classList.add('hidden');
    }
});

// --- NAVIGATION INTERACTION ---
// 1. Logo Scroll to Top
document.querySelector('.logo').addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 2. Menu Dropdown
const menuBtn = document.querySelector('.menu-btn');
const dropdown = document.querySelector('.dropdown-menu');
const menuLinks = document.querySelectorAll('.dropdown-menu a');

menuBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent immediate closing
    dropdown.classList.toggle('show');
});

// Close when clicking outside
document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== menuBtn) {
        dropdown.classList.remove('show');
    }
});

// Handle Link Clicks (Smooth Scroll & Close)
menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        // e.preventDefault(); // Optional
        dropdown.classList.remove('show');

        // Manual smooth scroll if not relying on CSS scroll-behavior
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            if (targetId) {
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                // Empty hash or just #
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });
});
