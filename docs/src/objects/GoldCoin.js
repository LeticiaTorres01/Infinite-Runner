export default class GoldCoin extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'gold_coin');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2.5);
    this.setOrigin(0.5, 0.5);
    this.setDepth(15);

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setVelocityX(-200); 
    }

    this.play('gold_coin_rotate');
    this.isCollected = false;
  }

  static preload(scene) {
    // 80x16 com 5 frames de 16x16
    scene.load.spritesheet('gold_coin', 'assets/MonedaD.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('gold_coin_rotate')) {
      scene.anims.create({
        key: 'gold_coin_rotate',
        frames: scene.anims.generateFrameNumbers('gold_coin', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: -1
      });
    }
  }

  collect(bird) {
    if (this.isCollected) return;
    this.isCollected = true;
    
    // Concede pontos e XP balanceados para o Round 3
    bird.gainExperience(10, 100); // 10 XP, 100 Pontos
    
    this.scene.tweens.add({
      targets: this,
      y: this.y - 100,
      alpha: 0,
      scale: 0,
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
