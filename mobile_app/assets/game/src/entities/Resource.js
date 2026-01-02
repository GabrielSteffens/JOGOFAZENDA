import * as THREE from 'three';

export class Resource {
    constructor(x, y, value, scene) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 15;
        this.value = value;
        this.collected = false;
        this.scene = scene;

        const geometry = new THREE.BoxGeometry(10, 10, 10);
        const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b }); // Meat
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 5, y);
        scene.add(this.mesh);
    }

    update(dt) {
        this.mesh.rotation.y += dt;
        this.mesh.position.y = 5 + Math.sin(Date.now() / 200) * 2;
    }

    destroy() {
        if (this.scene && this.mesh) {
            this.scene.remove(this.mesh);
        }
    }

    render(ctx) {
        // No-op for 3D
    }
}
