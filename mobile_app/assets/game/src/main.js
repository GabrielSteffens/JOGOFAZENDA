import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('game-container');
    const game = new Game(container);
    game.start();
});
