export default class Bird extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // Chama o construtor da classe pai (Sprite com física)
        // 'bird_fly' é a chave que definiremos no preload abaixo
        super(scene, x, y, 'bird_fly');

        // Adiciona este objeto à cena e ao mundo físico
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // --- Configurações Iniciais do Pássaro ---
        this.setScale(3); // Aumenta o tamanho (pixel art geralmente é pequeno)
        this.setCollideWorldBounds(true); // Impede que ele saia da tela
        
        // Inicia a animação de voo (definida abaixo)
        this.play('fly');
    }

    /**
     * Método estático para carregar os assets do pássaro.
     * É estático para poder ser chamado na Scene antes de criar o objeto.
     */
    static preload(scene) {
        // ATENÇÃO: Substitua frameWidth e frameHeight pelos valores reais da sua imagem!
        scene.load.spritesheet('bird_fly', 'assets/BirdFly.png', { 
            frameWidth: 16, 
            frameHeight: 16 
        });
    }

    /**
     * Define as animações do pássaro no gerenciador global do Phaser.
     */
    static createAnimations(scene) {
        scene.anims.create({
            key: 'fly', // Nome da animação
            // Gera os quadros automaticamente (do 0 ao 2, assumindo 3 frames)
            frames: scene.anims.generateFrameNumbers('bird_fly', { start: 0, end: 7 }),
            frameRate: 10, // Velocidade da animação (quadros por segundo)
            repeat: -1     // -1 significa repetir infinitamente
        });
    }
}
