export class Economy {
    constructor() {
        this.meat = 0;
        this.coins = 0;

        // Upgrade levels
        this.upgrades = {
            spikes: 1,
            spawn: 1,
            area: 1
        };

        this.ui = {
            meat: document.getElementById('meat-count'),
            coins: document.getElementById('coin-count')
        };
    }

    addMeat(amount) {
        this.meat += amount;
        this.updateUI();
    }

    sellMeat(value) {
        if (value > 0) {
            this.coins += value;
            this.meat = 0;
            this.updateUI();
            return value;
        }
        return 0;
    }

    buyUpgrade(type, cost) {
        if (this.coins >= cost) {
            this.coins -= cost;
            this.upgrades[type]++;
            this.updateUI();
            return true;
        }
        return false;
    }

    updateUI() {
        this.ui.meat.innerText = this.meat;
        this.ui.coins.innerText = this.coins;
    }
}
