import PlayScene from './scenes/PlayScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800, // Ajustado para um cenário mais largo que mostre bem a floresta
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false // Mude para true depois para ver as caixas de colisão
        }
    },
    // Aqui registramos as cenas importadas
    scene: [PlayScene]
};

const game = new Phaser.Game(config);
