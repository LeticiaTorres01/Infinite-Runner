export default class Poop extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, birdVelocityX) {
    super(scene, x, y, 'item1193');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 1. CONFIGURAÇÃO VISUAL
    this.setScale(1.5); // Menor que o pássaro (escala 3) para ser proporcional
    this.setDepth(15); // Atrás do pássaro mas à frente do fundo

    // 2. FÍSICA E MOVIMENTO
    if (this.body) {
      this.body.setAllowGravity(true);
      this.body.setGravityY(800); 
      // Herda um pouco da velocidade do pássaro E é puxado pelo movimento do cenário (-200)
      this.body.setVelocityX((birdVelocityX * 0.01) - 100); 
    }
  }

  static preload(scene) {
    scene.load.image('item1193', 'assets/item1193.png');
  }

  update() {
    // Destrói ao sair da tela (por baixo ou lados)
    if (this.y > this.scene.scale.height || this.x < -50) {
      this.destroy();
    }
  }
}
