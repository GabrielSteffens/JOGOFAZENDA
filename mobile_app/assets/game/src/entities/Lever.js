import * as THREE from 'three';

export class Lever {
    constructor(x, y, scene) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.active = false;
        this.cooldown = 0;

        // Sprite Setup
        const texLoader = new THREE.TextureLoader();
        const map = texLoader.load(`assets/textures/lever_sheet.png?t=${Date.now()}`);
        map.magFilter = THREE.NearestFilter;
        map.repeat.set(0.5, 1);
        map.offset.x = 0;

        const material = new THREE.SpriteMaterial({ map: map, transparent: true, alphaTest: 0.5 });
        this.mesh = new THREE.Sprite(material);
        this.mesh.scale.set(40, 40, 1);
        this.mesh.center.set(0.5, 0);
        this.mesh.position.set(x, 0, y);
        scene.add(this.mesh);
    }

    update(dt) {
        if (this.cooldown > 0) {
            this.cooldown -= dt;
            if (this.mesh.material.map) this.mesh.material.map.offset.x = 0.5;
        } else {
            if (this.mesh.material.map) this.mesh.material.map.offset.x = 0;
        }
    }

    interact() {
        if (this.cooldown <= 0) {
            this.active = !this.active;
            this.cooldown = 0.5;
            return true;
        }
        return false;
    }
}
