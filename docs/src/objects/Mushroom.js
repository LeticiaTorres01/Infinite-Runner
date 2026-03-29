export default class Mushroom extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mushroom_run');
    
    this.setScale(2); 
    this.setOrigin(0.5, 1); 
    this.setDepth(10);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body) {
      this.body.setAllowGravity(true);
      this.body.setGravityY(1500); 
      this.body.setSize(25, 35);
      this.body.setOffset(27, 29);
    }

    this.play('mushroom_run_anim');
    this.hp = 2;
    this.xpValue = 20;
    this.scoreValue = 100;
    this.isDead = false;
    
    const centerX = scene.scale.width / 2;
    this.jumpDirection = (x < centerX) ? 1 : -1;
    this.setFlipX(this.jumpDirection === 1);
    
    this.jumpPowerY = -600;
    this.jumpPowerX = 200 * this.jumpDirection;
  }

  static preload(scene) {
    scene.load.spritesheet('mushroom_idle', 'assets/Mushroom-Idle.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_run', 'assets/Mushroom-Run.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_attack', 'assets/Mushroom-Attack.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_die', 'assets/Mushroom-Die.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_hit', 'assets/Mushroom-Hit.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_stun', 'assets/Mushroom-Stun.png', { frameWidth: 80, frameHeight: 64 });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('mushroom_idle_anim')) {
        scene.anims.create({ key: 'mushroom_idle_anim', frames: scene.anims.generateFrameNumbers('mushroom_idle', { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
        scene.anims.create({ key: 'mushroom_run_anim', frames: scene.anims.generateFrameNumbers('mushroom_run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
        scene.anims.create({ key: 'mushroom_attack_anim', frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 0, end: 9 }), frameRate: 15, repeat: 0 });
        scene.anims.create({ key: 'mushroom_die_anim', frames: scene.anims.generateFrameNumbers('mushroom_die', { start: 0, end: 14 }), frameRate: 15, repeat: 0 });
        scene.anims.create({ key: 'mushroom_hit_anim', frames: scene.anims.generateFrameNumbers('mushroom_hit', { start: 0, end: 4 }), frameRate: 15, repeat: 0 });
        scene.anims.create({ key: 'mushroom_stun_anim', frames: scene.anims.generateFrameNumbers('mushroom_stun', { start: 0, end: 17 }), frameRate: 12, repeat: -1 });
    }
  }

  takeDamage() {
    if (!this.active || this.isDead) return;
    this.hp--;
    if (this.hp <= 0) this.die();
    else {
        this.play('mushroom_hit_anim');
        this.once('animationcomplete-mushroom_hit_anim', () => {
            if (!this.isDead) this.play('mushroom_run_anim');
        });
    }
  }

  update(bird, time, delta) {
    if (!this.active || this.isDead) return;

    const onGround = this.body && (this.body.blocked.down || this.body.touching.down);

    if (onGround) {
        this.body.setVelocityY(this.jumpPowerY);
        this.body.setVelocityX(this.jumpPowerX);
        this.play('mushroom_attack_anim');
    }

    if (this.x < -500 || this.x > this.scene.scale.width + 500) {
      this.destroy();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.anims) this.anims.stop();
    if (this.body) {
        this.body.setVelocityX(0);
        this.body.setAccelerationX(0);
    }
    this.play('mushroom_die_anim');
    this.once('animationcomplete-mushroom_die_anim', () => {
        this.destroy();
    });
  }
}
