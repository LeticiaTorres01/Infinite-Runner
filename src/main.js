import StoryScene from './scenes/StoryScene.js';
import PlayScene from './scenes/PlayScene.js';

const config = {
    type: Phaser.AUTO,
    // Pega a largura e altura exatas da janela do seu navegador
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 500 },
            debug: true // Mudei para true para vermos as hitboxes
        }
    },
    scene: [StoryScene, PlayScene]
};

const game = new Phaser.Game(config);

// Garante que o jogo redimensione se você alterar o tamanho da janela do navegador
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
