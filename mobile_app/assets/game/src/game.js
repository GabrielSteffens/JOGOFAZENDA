import * as THREE from 'three';
import { Player } from './entities/Player.js';
import { Spike } from './entities/Spike.js';
import { Lever } from './entities/Lever.js';
import { Animal } from './entities/Animal.js';
import { Resource } from './entities/Resource.js';
import { Economy } from './systems/Economy.js';
import { AssetManager } from './systems/AssetManager.js';
import { UpgradePad } from './entities/UpgradePad.js';
import { SellWorkbench } from './entities/SellWorkbench.js';
import { MapSystem } from './systems/MapSystem.js';

export class Game {
    constructor(container) {
        this.container = container;
        this.lastTime = 0;

        this.input = {
            keys: {},
            mouse: { x: 0, y: 0, down: false }
        };

        this.economy = new Economy();
        this.assets = new AssetManager();

        // Three.js Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2a2a2a);

        // Camera (Isometric-ish)
        const aspect = container.clientWidth / container.clientHeight;
        const d = 400;
        this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

        this.camera.position.set(200, 200, 200); // Isometric angle
        this.camera.lookAt(0, 0, 0); // Look at center of world (or player later)

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;

        // Append canvas to container, but before UI layer
        this.container.insertBefore(this.renderer.domElement, this.container.firstChild);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Brighter
        this.scene.add(ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2); // Strong Sun
        this.dirLight.position.set(100, 200, 50);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.camera.left = -500;
        this.dirLight.shadow.camera.right = 500;
        this.dirLight.shadow.camera.top = 500;
        this.dirLight.shadow.camera.bottom = -500;
        this.scene.add(this.dirLight);

        // --- MAP SYSTEM (Infinite World) ---
        this.mapSystem = new MapSystem(this.scene);
        // Deferred update until all objects are created

        this.setupInput();
        this.setupUI();
        window.addEventListener('resize', () => this.resize());

        // Game State
        // Note: Coordinates in 3D are (x, 0, z). Y is up.
        // We will map 2D (x, y) to 3D (x, z).
        // Let's center the game area around 0,0 for easier camera logic?
        // Or keep 0,0 as top-left to match previous logic?
        // Let's keep 0,0 as top-left for now to minimize logic changes, 
        // but we might need to adjust camera position to look at the center of the play area.
        // Previous play area was approx 1280x720.
        // Let's shift camera to look at center: 640, 0, 360.
        // Camera (RPG/GBA Style - Straight angle, not diagonal)
        // Positioned South-Up (Looking North)
        this.camera.position.set(640, 400, 360 + 400); // Back and Up
        this.camera.lookAt(640, 0, 360);

        this.player = new Player(100, 100, this.scene, this.assets);
        this.unlockedZones = 1;

        this.spikes = [
            new Spike(300, 200, 200, 200, this.scene) // Chicken Zone
        ];

        // Cow Zone (Initialized but potentially hidden or inactive until unlocked? 
        // For simplicity, we create it when unlocked, OR create it now but don't spawn there)
        // Let's create it dynamically when unlocked to support "infinite" expansion logic if needed.

        this.lever = new Lever(250, 450, this.scene);
        this.animals = [];
        this.resources = [];

        this.spawnTimer = 0;
        this.spawnRate = 3;

        // Selling Workbench (Stardew Style)
        this.sellWorkbench = new SellWorkbench(850, 150, this.scene); // Centered approx where zone was



        // --- UPGRADES ---
        this.pads = [];
        this.projectLevers = [];

        const createUpgradeStation = (x, y, name, cost, callback) => {
            const pad = new UpgradePad(x, y, name, cost, this.scene, callback);
            this.pads.push(pad);

            const lever = new Lever(x + 40, y, this.scene);
            this.projectLevers.push({ lever, cost, callback });
        };

        // 1. Spikes Upgrade
        createUpgradeStation(200, 600, "Spikes", 10, (price) => {
            if (this.economy.buyUpgrade('spikes', price)) {
                this.spikes.forEach(s => s.damage *= 1.5);
                return true;
            }
            return false;
        });

        // 2. Spawn Upgrade
        createUpgradeStation(400, 600, "Chickens", 25, (price) => {
            if (this.economy.buyUpgrade('spawn', price)) {
                this.spawnRate = Math.max(0.5, this.spawnRate * 0.8);
                return true;
            }
            return false;
        });

        // 3. Area Upgrade
        createUpgradeStation(600, 600, "Expand", 1000, (price) => {
            if (this.economy.buyUpgrade('area', price)) {
                if (this.unlockedZones === 1) {
                    this.unlockedZones = 2;
                    this.spikes.push(new Spike(700, 200, 200, 200, this.scene));
                    console.log("Zone 2 Unlocked!");
                }
                return true;
            }
            return false;
        });

        // Initial Map Generation
        const leverObstacles = this.projectLevers.map(l => l.lever);
        const initObstacles = [...this.pads, ...this.spikes, ...leverObstacles, this.sellWorkbench, this.lever];
        this.mapSystem.update(0, 0, initObstacles);
    }

    setupInput() {
        window.addEventListener('keydown', e => this.input.keys[e.key] = true);
        window.addEventListener('keyup', e => this.input.keys[e.key] = false);

        window.addEventListener('keydown', e => {
            if (e.code === 'Space') {
                this.checkInteractions();
            }
        });
    }

    setupUI() {
        // Obsolete: Replaced by In-World Upgrade Pads
        const panel = document.getElementById('upgrade-panel');
        if (panel) panel.style.display = 'none'; // Hide HTML UI
    }

    checkInteractions() {
        // Check Upgrade Levers
        this.projectLevers.forEach((leverObj) => {
            const dist = Math.hypot(this.player.x - leverObj.lever.x, this.player.y - leverObj.lever.y);
            if (dist < 50) {
                if (leverObj.lever.interact()) {
                    const success = leverObj.callback(leverObj.cost);
                    if (!success) {
                        leverObj.lever.active = false;
                        leverObj.lever.cooldown = 0;
                        leverObj.lever.update(0);
                    }
                }
            }
        });
    }

    resize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const aspect = width / height;
        const d = 400;

        this.camera.left = -d * aspect;
        this.camera.right = d * aspect;
        this.camera.top = d;
        this.camera.bottom = -d;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    async start() {
        // Wait for assets
        console.log("Loading assets...");
        const p1 = this.assets.load('chicken', `assets/models/chicken.glb?t=${Date.now()}`);
        const p2 = this.assets.load('player_model', `assets/models/characters.glb?t=${Date.now()}`);

        await Promise.all([p1, p2]);
        console.log("Assets loaded!");

        // Re-init player with loaded sprite
        this.scene.remove(this.player.mesh);
        this.player = new Player(100, 100, this.scene, this.assets);

        this.renderer.setAnimationLoop(this.loop.bind(this));
    }

    loop(timestamp) {
        // Three.js passes timestamp in ms
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();
    }

    update(dt) {
        const bounds = { width: 2000, height: 2000 }; // Larger bounds for 3D world

        // Map System Call - Pass Obstacles
        const obstacles = [...this.pads, ...this.spikes, this.sellWorkbench, this.lever];
        this.mapSystem.update(this.player.x, this.player.y, obstacles);

        // Camera Follow
        const targetX = this.player.x;
        const targetZ = this.player.y; // player.y is Z in 3D space

        // Update Camera Position
        // Maintain the isometric angle offsets
        this.camera.position.set(targetX, 400, targetZ + 400);
        this.camera.lookAt(targetX, 0, targetZ);

        // Light Follow
        this.dirLight.position.set(targetX + 100, 200, targetZ + 100);
        this.dirLight.target.position.set(targetX, 0, targetZ);
        this.dirLight.target.updateMatrixWorld();

        // Spawning
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {

            // Loop through unlocked zones to spawn
            this.spikes.forEach((zone, index) => {
                // Count animals in this zone (approximate, or global cap?)
                // Let's use global cap expanded by zones for now, or per zone?
                // Simple: Global cap logic but spawn one per tick in a random zone or round robin

                if (this.animals.length < 10 * this.economy.upgrades.spawn * this.unlockedZones) {
                    // Determine Type
                    // Zone 0 = Chicken
                    // Zone 1 = Cow
                    const type = index === 0 ? 'chicken' : 'cow';

                    // Spawn
                    const model = type === 'chicken' ? this.assets.get('chicken') : null; // Cows handle their own procedural mesh

                    const animal = new Animal(
                        zone.x + Math.random() * (zone.width - 20),
                        zone.y + Math.random() * (zone.height - 20),
                        this.scene,
                        model,
                        type
                    );
                    animal.homeZone = zone; // Assign zone for bounds
                    this.animals.push(animal);
                }
            });

            this.spawnTimer = this.spawnRate;
        }

        // Updates
        this.player.update(dt, this.input, bounds);
        this.spikes.forEach(spike => spike.update(dt));
        this.lever.update(dt);
        this.animals.forEach(animal => animal.update(dt, animal.homeZone));
        this.resources.forEach(res => res.update(dt));

        // Collisions: Spikes vs Animals
        this.spikes.forEach(spike => {
            if (spike.active) {
                this.animals.forEach(animal => {
                    if (animal.alive &&
                        animal.x + animal.width > spike.x &&
                        animal.x < spike.x + spike.width &&
                        animal.y + animal.height > spike.y &&
                        animal.y < spike.y + spike.height) {

                        if (animal.takeDamage(spike.damage * dt)) {
                            this.resources.push(new Resource(animal.x, animal.y, animal.dropValue, this.scene));
                        }
                    }
                });
            }
        });

        // Cleanup dead animals
        this.animals = this.animals.filter(a => {
            if (!a.alive) {
                // Mesh removal handled in Animal class or we should do it here?
                // Better to let Animal handle its own cleanup or call a destroy method
                // For now, let's assume Animal removes itself from scene on death or we call it
                return false;
            }
            return true;
        });

        // Collisions: Player vs Resources
        this.resources.forEach(res => {
            if (!res.collected) {
                const dist = Math.hypot(this.player.x - res.x, this.player.y - res.y);
                if (dist < 30) {
                    if (this.player.holdingMeat < this.player.maxCapacity) {
                        res.collected = true;
                        res.destroy(); // Remove mesh
                        this.player.holdingMeat++;
                        this.player.heldValue += res.value; // Add actual value
                        this.economy.meat = this.player.holdingMeat;
                        this.economy.updateUI();
                    }
                }
            }
        });

        this.resources = this.resources.filter(r => !r.collected);

        // Check Pad Upgrades (Visual updates only)
        this.pads.forEach(p => p.update(dt));

        // Update Levers
        this.projectLevers.forEach(l => l.lever.update(dt));

        // Sell Workbench Collision
        this.sellWorkbench.checkCollision(this.player, this.economy);
    }

}

render() {
    this.renderer.render(this.scene, this.camera);
}
}
