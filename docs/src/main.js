import InitialSceneD from './scenes/InitialSceneD.js';
import Phase1Scene from './scenes/Phase1Scene.js';
import Phase2Scene from './scenes/Phase2Scene.js';
import CreditsScene from './scenes/CreditsScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT, // Escala o canvas para caber no monitor
        autoCenter: Phaser.Scale.CENTER_BOTH, // Centraliza visualmente
        width: 1920, // Largura Lógica Fixa
        height: 1080, // Altura Lógica Fixa
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 }, // Aumentado para compensar a resolução maior
            debug: true, // Ativa o modo de depuração para ver os corpos físicos
        }
    },
    scene: [InitialSceneD, Phase1Scene, Phase2Scene, CreditsScene]
};

const game = new Phaser.Game(config);

game.events.on('ready', () => {
    console.log('Jogo pronto em 1080p!');
});
