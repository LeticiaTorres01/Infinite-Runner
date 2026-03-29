export default class BlueCoin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'blue_coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2.5);
    this.setDepth(15);

    if (this.body) {
      this.body.setAllowGravity(false);
      // Fazer a moeda deslizar com o cenário
      this.body.setVelocityX(-200); 
    }

    this.play('blue_coin_rotate');
    this.isCollected = false;
  }

  static preload(scene) {
    // Carregando como spritesheet. Assumindo 16x16 com 4 frames baseado no nome 'strip4'
    scene.load.spritesheet('blue_coin', 'assets/spr_coin_azu.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('blue_coin_rotate')) {
      scene.anims.create({
        key: 'blue_coin_rotate',
        frames: scene.anims.generateFrameNumbers('blue_coin', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;
    
    // Efeito simples de coleta: sobe e desaparece
    this.scene.tweens.add({
      targets: this,
      y: this.y - 100,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
  }

  update() {
    if (this.x < -50) {
      this.destroy();
    }
  }
}
