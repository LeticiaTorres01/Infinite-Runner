export default class Bird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Chama o construtor da classe pai (Sprite com física)
    super(scene, x, y, 'bird_fly');

    // Adiciona este objeto à cena e ao mundo físico
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // --- Configurações Iniciais do Pássaro ---
    this.setScale(3); // Aumenta o tamanho
    this.setCollideWorldBounds(true); // Impede que ele saia da tela

    // Verificação de segurança para o corpo físico
    if (this.body) {
      this.body.setAllowGravity(false);
    }

    // Inicia a animação de voo
    this.play('fly');
    this.speed = 300; // Velocidade mais equilibrada
    this.isDead = false;
  }

  /**
   * Método estático para carregar os assets do pássaro.
   */
  static preload(scene) {
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
      key: 'fly',
      frames: scene.anims.generateFrameNumbers('bird_fly', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
  }

  // Método para processar a morte do personagem
  die() {
    if (this.isDead) return;
    
    this.isDead = true;

    // 1. Congele o frame
    this.anims.stop();
    this.setFrame(0); 

    // 2. Feedback de impacto (Ficar vermelho)
    this.setTint(0xff0000);
    
    // 3. Queda livre
    this.setAngle(90); // Rotaciona o bico para baixo
    this.setVelocityX(0); // Zera velocidade horizontal
    
    if (this.body) {
      this.body.setAllowGravity(true);
      this.body.setGravityY(1000); 
      this.body.checkCollision.none = true; // FAZ ELE ATRAVESSAR O CHÃO
    }

    // Desativa colisões com o mundo para ele "despencar para fora da tela"
    this.setCollideWorldBounds(false);
  }

  // Efeito de flutuar suavemente na tela de início
  idleFloating(time) {
    if (this.isDead) return;
    this.y += Math.sin(time / 200) * 0.5;
  }

  update(cursors) {
    if (this.isDead) return; // Se estiver morto, ignora comandos de entrada

    // Primeiro, zeramos a velocidade a cada frame para ele parar se soltarmos a tecla
    this.setVelocity(0);

    // --- MOVIMENTO HORIZONTAL ---
    if (cursors.left.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true); // ESPELHA O PÁSSARO
    } else if (cursors.right.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false); // VOLTA AO NORMAL
    }

    // --- MOVIMENTO VERTICAL ---
    if (cursors.up.isDown) {
      this.setVelocityY(-this.speed);
    } else if (cursors.down.isDown) {
      this.setVelocityY(this.speed);
    }
  }
}
