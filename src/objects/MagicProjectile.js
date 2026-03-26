export default class MagicProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, targetX, targetY, isCharged = false) {
    // Agora o projétil em voo usa sempre o pellet básico
    super(scene, x, y, 'magic_pellet');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2); 
    this.setDepth(60);
    this.isCharged = isCharged;

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setSize(12, 12);
      this.body.setOffset(10, 10);
    }

    this.play('magic_pellet_anim');

    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const speed = isCharged ? 450 : 300;
    scene.physics.velocityFromRotation(angle, speed, this.body.velocity);
    this.setRotation(angle);

    this.particles = scene.add.particles(0, 0, 'fairy_flash', {
        speed: 10,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.4, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        frequency: 30
    });

    this.particles.startFollow(this);

    this.on('destroy', () => {
        if (this.particles) this.particles.destroy();
    });
  }

  static preload(scene) {
    scene.load.spritesheet('magic_pellet', 'assets/Magic_Pellet (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('magic_charged_pellet', 'assets/Magic_Charged_Pellet (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('final_impact_fx', 'assets/Final_Impact_FX.png', { frameWidth: 291, frameHeight: 301 });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('magic_pellet_anim')) {
      scene.anims.create({
        key: 'magic_pellet_anim',
        frames: scene.anims.generateFrameNumbers('magic_pellet', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!scene.anims.exists('magic_charged_pellet_anim')) {
      scene.anims.create({
        key: 'magic_charged_pellet_anim',
        frames: scene.anims.generateFrameNumbers('magic_charged_pellet', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!scene.anims.exists('giant_climax_impact')) {
      scene.anims.create({
        key: 'giant_climax_impact',
        frames: scene.anims.generateFrameNumbers('final_impact_fx', { start: 0, end: 29 }),
        frameRate: 30,
        repeat: 0
      });
    }
  }

  explode() {
    if (!this.active) return;
    if (this.particles) this.particles.stop();

    this.body.setVelocity(0);
    this.play('giant_climax_impact');
    this.setScale(this.isCharged ? 1.2 : 0.7);
    this.setRotation(0);
    
    this.once('animationcomplete', () => {
      this.destroy();
    });
  }

  update() {
    if (this.x < -100 || this.x > this.scene.scale.width + 100 || this.y < -100 || this.y > this.scene.scale.height + 100) {
      this.destroy();
    }
  }
}
