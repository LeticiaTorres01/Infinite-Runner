export default class Fruit extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, isStaticDecoration = false) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2);
    this.setDepth(15);
    // Define o ponto de rotação no topo para parecer pendurada
    this.setOrigin(0.5, 0); 
    this.isStaticDecoration = isStaticDecoration;

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      this.body.setImmovable(isStaticDecoration);
      if (!isStaticDecoration) this.body.setVelocityX(-200);
    }

    this.isCollected = false;
    
    // Efeito de Swing (Balanço de Gangorra/Pêndulo)
    this.swingSpeed = Phaser.Math.FloatBetween(0.002, 0.004);
    this.swingAmount = Phaser.Math.FloatBetween(10, 20); // Graus de rotação
    this.timeOffset = Phaser.Math.FloatBetween(0, 1000);
  }

  static preload(scene) {
    scene.load.image('fruit_apple', 'assets/item322.png');
    scene.load.image('fruit_banana', 'assets/item344.png');
    scene.load.image('fruit_cherry', 'assets/item382.png');
  }

  collect(bird) {
    if (this.isCollected) return;
    this.isCollected = true;

    if (this.scene && typeof this.scene.playSfx === 'function') {
      this.scene.playSfx('food', { volume: 0.8 });
    }
    
    bird.gainAmmo(2);
    
    this.scene.tweens.add({
      targets: this,
      scale: 0,
      alpha: 0,
      duration: 300,
      onComplete: () => this.destroy()
    });
  }

  update(time) {
    if (!this.isStaticDecoration && this.x < -100) {
      this.destroy();
      return;
    }

    if (!this.isCollected) {
        // Aplica o balanço lateral (rotação)
        this.angle = Math.sin((time + this.timeOffset) * this.swingSpeed) * this.swingAmount;
    }
  }
}
