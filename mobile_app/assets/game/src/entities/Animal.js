import * as THREE from 'three';

export class Animal {
    constructor(x, y, scene, model, type = 'chicken') {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = type === 'cow' ? 30 : 50; // Cows are slower
        this.health = type === 'cow' ? 200 : 100; // Cows are tankier
        this.alive = true;
        this.scene = scene;
        this.type = type;
        this.dropValue = type === 'cow' ? 10 : 1000; // Value Logic (TESTING)

        this.moveTimer = 0;
        this.moveDir = { x: 0, y: 0 };

        // Mesh Generation
        if (type === 'chicken') {
            // Sprite
            const texLoader = new THREE.TextureLoader();
            const map = texLoader.load('assets/textures/chicken_stardew.png');
            map.magFilter = THREE.NearestFilter;
            const mat = new THREE.SpriteMaterial({ map: map });
            this.mesh = new THREE.Sprite(mat);
            this.mesh.scale.set(30, 30, 1);
            this.mesh.center.set(0.5, 0); // Feet pivot

            this.mesh.position.set(x, 0, y);

            // Shadow
            const shadowGeo = new THREE.CircleGeometry(8, 16);
            const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true });
            this.shadow = new THREE.Mesh(shadowGeo, shadowMat);
            this.shadow.rotation.x = -Math.PI / 2;
            this.shadow.position.y = 1;
            scene.add(this.shadow);

        } else if (type === 'cow') {
            // -- PROCEDURAL BLOCKY COW --
            this.mesh = new THREE.Group();
            // ... (Cow logic unchanged, just condensed for brevity if needed, but I'll keep it)
            // Since I can't collapse easily without rewriting, I will just copy the existing cow logic or try to match start/end lines precisely
            // Wait, the chunk replacement requires me to provide the "Cow" logic if I replace the whole block.
            // I'll target the "if (type === 'chicken' ...)" block specifically if possible.
            // But the original had "if (type === 'chicken' && model) ... else if (type === 'cow') ..."
            // I want to change the first condition to just "if (type === 'chicken')".

            // Body (White)
            const bodyGeo = new THREE.BoxGeometry(20, 15, 30);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 15;
            this.mesh.add(body);

            // Spots
            const spotGeo = new THREE.BoxGeometry(5, 1, 5);
            const spotMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const spot1 = new THREE.Mesh(spotGeo, spotMat);
            spot1.position.set(5, 23, 5);
            this.mesh.add(spot1);

            const spot2 = new THREE.Mesh(spotGeo, spotMat);
            spot2.position.set(-3, 23, -8);
            this.mesh.add(spot2);

            // Head
            const headGeo = new THREE.BoxGeometry(12, 12, 12);
            const head = new THREE.Mesh(headGeo, bodyMat);
            head.position.set(0, 25, 20); // Front
            this.mesh.add(head);

            // Legs
            const legGeo = new THREE.BoxGeometry(5, 10, 5);
            const createLeg = (lx, lz) => {
                const leg = new THREE.Mesh(legGeo, bodyMat);
                leg.position.set(lx, 5, lz);
                this.mesh.add(leg);
            };
            createLeg(-6, -10);
            createLeg(6, -10);
            createLeg(-6, 10);
            createLeg(6, 10);

            this.mesh.position.set(x, 0, y);
            this.mesh.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; } });

        } else {
            // Fallback
            const geometry = new THREE.SphereGeometry(10, 16, 16);
            const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.position.set(x, 10, y);
            this.mesh.castShadow = true;
        }

        scene.add(this.mesh);
    }

    update(dt, bounds) {
        if (!this.alive) return;

        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.moveTimer = Math.random() * 2 + 1;
            const angle = Math.random() * Math.PI * 2;
            this.moveDir.x = Math.cos(angle);
            this.moveDir.y = Math.sin(angle);

            // Only rotate if 3D Mesh
            if (this.type !== 'chicken') {
                this.mesh.rotation.y = -angle + Math.PI / 2;
            } else {
                // Flip sprite if needed
                if (this.moveDir.x < 0) this.mesh.scale.x = -30;
                else this.mesh.scale.x = 30;
            }
        }

        this.x += this.moveDir.x * this.speed * dt;
        this.y += this.moveDir.y * this.speed * dt;

        if (bounds) {
            // Apply Padding/Margin
            const padding = 10;

            this.x = Math.max(bounds.x + padding, Math.min(bounds.x + bounds.width - this.width - padding, this.x));
            this.y = Math.max(bounds.y + padding, Math.min(bounds.y + bounds.height - this.height - padding, this.y));
        }

        this.mesh.position.x = this.x;
        this.mesh.position.z = this.y;

        // Sync Shadow
        if (this.shadow) {
            this.shadow.position.x = this.x;
            this.shadow.position.z = this.y;
        }

        // Hop animation
        if (this.type !== 'chicken') {
            this.mesh.position.y = 10 + Math.abs(Math.sin(Date.now() / 100)) * 5;
        } else {
            this.mesh.position.y = 15 + Math.abs(Math.sin(Date.now() / 100)) * 5; // Hop for sprite
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.alive = false;
            this.scene.remove(this.mesh); // Remove from scene
            if (this.shadow) this.scene.remove(this.shadow);
            return true;
        }
        // Flash red
        if (!this.isFlashing) {
            this.isFlashing = true;
            this.setMeshColor(0xff0000);
            setTimeout(() => {
                if (this.alive) {
                    this.setMeshColor(0xffffff);
                    this.isFlashing = false;
                }
            }, 100);
        }
        return false;
    }

    setMeshColor(hex) {
        if (this.mesh.isGroup) {
            this.mesh.traverse((node) => {
                if (node.isMesh) {
                    node.material.color.setHex(hex);
                }
            });
        } else if (this.mesh.material) {
            this.mesh.material.color.setHex(hex);
        }
    }
}
