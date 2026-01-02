import * as THREE from 'three';

export class UpgradePad {
    constructor(x, y, label, cost, scene, onBuy) {
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 120;
        this.cost = cost;
        this.label = label;
        this.onBuy = onBuy;
        this.scene = scene;

        // Group
        this.group = new THREE.Group();
        this.group.position.set(x, 1, y);
        scene.add(this.group);
        this.cooldown = 0;




        // Visual: Upgrade Workbench (Sprite) - Restored
        const texLoader = new THREE.TextureLoader();
        const map = texLoader.load('assets/textures/upgrade_bench.png');
        map.magFilter = THREE.NearestFilter;
        const mat = new THREE.SpriteMaterial({ map: map });
        const mesh = new THREE.Sprite(mat);
        mesh.scale.set(60, 60, 1);
        mesh.position.y = 15; // Raised slightly
        this.group.add(mesh);

        // Ground Podium Removed as per user request

        // Text Canvas (Price - Floating above)
        this.canvas = document.createElement('canvas');
        this.canvas.width = 256;
        this.canvas.height = 256;
        this.ctx = this.canvas.getContext('2d');
        this.updateTexture();

        const tex = new THREE.CanvasTexture(this.canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: tex });
        const textSprite = new THREE.Sprite(spriteMat);
        textSprite.position.y = 80; // Higher up
        textSprite.scale.set(60, 60, 1);
        this.group.add(textSprite);
    }

    updateTexture() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 256, 256);

        // Background for text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(10, 80, 236, 100, 20);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, 128, 120);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 50px Arial';
        ctx.fillText(`${this.cost} $`, 128, 170);
    }

    updateCost(newCost) {
        this.cost = newCost;
        this.canvas.getContext('2d').clearRect(0, 0, 256, 256); // Force clear

        // Find the sprite with CanvasTexture (it's the last one added usually, or filter)
        const textSprite = this.group.children.find(c => c.isSprite && c.material.map && c.material.map.isCanvasTexture);
        if (textSprite) {
            this.updateTexture();
            textSprite.material.map.needsUpdate = true;
        }
    }

    checkCollision(player, economy) {
        // Simple AABB
        if (player.x > this.x - this.width / 2 &&
            player.x < this.x + this.width / 2 &&
            player.y > this.y - this.height / 2 &&
            player.y < this.y + this.height / 2) {

            // Try buy
            if (economy.coins >= this.cost) {
                // Add debounce to prevent instant rapid buying?
                if (this.cooldown && this.cooldown > 0) return false;

                if (this.onBuy(this.cost)) {
                    // Cost Scaling
                    const newCost = Math.floor(this.cost * 1.5);
                    this.updateCost(newCost);

                    // Cooldown to prevent accidental double buy
                    this.cooldown = 1.0;
                    return true;
                }
            }
        }
        if (this.cooldown > 0) this.cooldown -= 0.016; // Approx dt
        return false;
    }
}
