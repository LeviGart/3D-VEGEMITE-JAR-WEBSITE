// npm run dev for local host

import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// Setup
const scene = new THREE.Scene();
scene.background = null; // Ensure background is transparent to show CSS color

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 12);

const defaultCameraPosition = new THREE.Vector3(0, 0, 0);
const defaultCameraRotation = new THREE.Euler(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.querySelector('#bg'), 
    antialias: true,
    alpha: true // Enables canvas transparency
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// HDRI Environment Lighting
const hdrLoader = new RGBELoader();
hdrLoader.load('Assets/kloppenheim_07_puresky_4k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Apply HDRI for environment lighting
    scene.environment = texture;
    //scene.background = texture; // toggle this for css or hdri background
    
});

// GLB model
let vegejar; // Declare `vegejar` globally for the Vegemite jar model
let mixer; // Animation mixer for the model
let action; // Animation action for 'OPENLID'

const loader = new GLTFLoader();
loader.load(
    'Assets/Vegemite Jar Ver7.glb',
    (gltf) => {
        vegejar = gltf.scene; // Assign the loaded model to `vegejar`
        vegejar.scale.set(120, 120, 120);
        vegejar.position.set(0, -5, 0);
        vegejar.rotation.set(0, 9.8, 0);
        scene.add(vegejar);

        mixer = new THREE.AnimationMixer(vegejar); // Create mixer for animations
        const clips = gltf.animations; // Get all animations
        const clip = THREE.AnimationClip.findByName(clips, 'OPENLID'); // Find 'OPENLID' animation
        action = mixer.clipAction(clip); // Create animation action

        // Configure animation
        action.setLoop(THREE.LoopOnce, 1); // Play animation only once
        action.clampWhenFinished = true;  // Hold the last frame when finished
        action.timeScale = 1;             // Default to forward playback
        action.enabled = true;
    },
    (xhr) => {
        console.log(`Vegemite Jar loading: ${(xhr.loaded / xhr.total * 100)}% loaded`);
    },
    (error) => {
        console.error('An error occurred while loading the Vegemite Jar:', error);
    }
);

// Lights
const hemiLight = new THREE.HemisphereLight(0xffce00, 0xffce00, 1.5);
const pointLight = new THREE.PointLight(0xffffff, 2, 30);
pointLight.position.set(5, 5, 0);
pointLight.castShadow = true;
scene.add(hemiLight,pointLight);

//helpers
const lightHelper = new THREE.PointLightHelper(pointLight)
const gridHelper = new THREE.GridHelper(200, 50);
//scene.add(lightHelper, gridHelper)


// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);

// Button to Play Animation
let isLidOpen = false; // Tracks whether the lid is open

document.getElementById('playOpenLid').addEventListener('click', () => {
    const toggleButton = document.getElementById('playOpenLid'); // Reference to the button

    if (action) {
        if (!isLidOpen) {
            // Open the lid
            action.timeScale = 0.5; // Play forward
            action.reset(); // Ensure the animation starts from the beginning
            action.clampWhenFinished = true; // Hold the last frame when finished
            action.play();  // Play the animation

            // Change button text to "Close Lid"
            toggleButton.innerText = "Close Lid";
        } else {
            // Close the lid
            action.timeScale = -0.5; // Play backward
            action.reset(); // Reset to prepare for playback
            action.clampWhenFinished = false; // Temporarily disable clamping
            action.paused = false; // Ensure action is not paused
            action.time = action.getClip().duration; // Start the animation at the last frame
            action.play();  // Play the animation

            // Change button text back to "Open Lid"
            toggleButton.innerText = "Open Lid";
        }

        // Toggle the lid state
        isLidOpen = !isLidOpen;
    } else {
        console.warn('Animation action is not yet loaded.');
    }
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    if (mixer) {
        mixer.update(0.016); // Advance the animation mixer (60 FPS)
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Reset Button
document.getElementById('resetView').addEventListener('click', () => {
    // Reset the camera position and rotation
    camera.position.copy(defaultCameraPosition);
    camera.rotation.copy(defaultCameraRotation);
    controls.reset(); // Reset OrbitControls

    // Reset the animation state
    if (action) {
        action.reset(); // Reset animation to the starting frame
        action.stop();  // Stop the animation
    }

    // Reset the toggle state and button text
    isLidOpen = false; // Reset lid state
    const toggleButton = document.getElementById('playOpenLid');
    toggleButton.innerText = "Open Lid"; // Reset button text to default
});

// Handle window resizing
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
