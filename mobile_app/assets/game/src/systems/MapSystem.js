import * as THREE from 'three';

export class MapSystem {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 1000;
        this.chunks = {}; // "cx,cy" -> { mesh, trees: [] }

        // Ground Texture
        const texLoader = new THREE.TextureLoader();
        this.groundTex = texLoader.load('assets/textures/grass_stardew.png');
        this.groundTex.wrapS = THREE.RepeatWrapping;
        this.groundTex.wrapT = THREE.RepeatWrapping;
        this.groundTex.repeat.set(10, 10); // Match scale (previously 20 for 2000 size)
        this.groundTex.magFilter = THREE.NearestFilter;
        this.groundTex.minFilter = THREE.NearestFilter;

        this.groundMat = new THREE.MeshStandardMaterial({ map: this.groundTex });
        this.groundGeo = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize);

        // Updated for Sprites
        // Texture
        const loader = new THREE.TextureLoader();
        this.treeMap = loader.load('assets/textures/tree.png');
        this.treeMap.magFilter = THREE.NearestFilter;
        this.treeMat = new THREE.SpriteMaterial({ map: this.treeMap });

        // Collision List (Static objects to avoid)
        this.obstacles = [];
    }

    update(px, py, obstacles = []) {
        this.obstacles = obstacles;

        // Calculate current chunk
        // px, py correspond to world x, z
        const cx = Math.floor((px + this.chunkSize / 2) / this.chunkSize);
        const cy = Math.floor((py + this.chunkSize / 2) / this.chunkSize);

        // Load 3x3 grid around player
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                this.loadChunk(cx + dx, cy + dy);
            }
        }
    }

    loadChunk(cx, cy) {
        const key = `${cx},${cy}`;
        if (this.chunks[key]) return;

        const chunk = { mesh: null, trees: [] };

        // Ground Mesh
        const mesh = new THREE.Mesh(this.groundGeo, this.groundMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.receiveShadow = true;
        // Position: Center of chunk
        // Using +chunkSize/2 offset on update means grid 0 is centered at 0,0?
        // Let's verify: cx=0 -> pos=0. Correct.
        mesh.position.set(cx * this.chunkSize, 0, cy * this.chunkSize);
        this.scene.add(mesh);
        chunk.mesh = mesh;

        // Decorations (Trees) - Deterministic "Fixed" Locations
        const pseudoRandom = (x, y) => {
            return Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
        };

        const chunkSeed = cx * 73856093 ^ cy * 19349663;

        for (let i = 0; i < 10; i++) {
            const tSeed = chunkSeed + i * 1123;
            const r1 = pseudoRandom(tSeed, 1);
            const r2 = pseudoRandom(tSeed, 2);

            // World pos candidate
            const wx = cx * this.chunkSize + (r1 - 0.5) * this.chunkSize;
            const wz = cy * this.chunkSize + (r2 - 0.5) * this.chunkSize;

            // Safe Zone Check
            const distCenter = Math.hypot(wx, wz);
            if (distCenter < 500) continue;

            // Obstacle Check (Strict)
            let safe = true;
            for (let obs of this.obstacles) {
                let obX = obs.x;
                let obZ = obs.y;

                if (obX === undefined && obs.group) { obX = obs.group.position.x; obZ = obs.group.position.z; }
                if (obX === undefined && obs.mesh) { obX = obs.mesh.position.x; obZ = obs.mesh.position.z; }
                if (obX === undefined) continue;

                // Radius check - 200 units
                if (Math.hypot(wx - obX, wz - obZ) < 200) {
                    safe = false;
                    break;
                }
            }
            if (!safe) continue;

            this.createTree(wx, wz, chunk.trees);
        }

        this.chunks[key] = chunk;
        // console.log(`Loaded Chunk ${key}`);
    }

    createTree(x, z, list) {
        const sprite = new THREE.Sprite(this.treeMat);
        sprite.position.set(x, 40, z); // Adjust Y for base

        const S = 80 + Math.random() * 40;
        sprite.scale.set(S, S, 1);

        this.scene.add(sprite);
        list.push(sprite);
    }
}
