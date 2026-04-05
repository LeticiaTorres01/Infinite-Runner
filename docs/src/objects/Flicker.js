export default class Flicker extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'flicker_idle');
    
    this.setScale(1.5); 
    this.setOrigin(0.5, 1); 
    this.setDepth(15);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body) {
      this.body.setAllowGravity(false); 
      this.body.setSize(20, 20);
      this.body.setOffset(6, 6);
      this.body.setVelocityX(-200); 
    }

    this.play('flicker_idle_anim');
    this.hp = 3;
    this.xpValue = 10;
    this.scoreValue = 50;
    this.isDead = false;

    this.isUpgraded = false;
    this.isUltimate = false;
    this.detectionRadius = 290; 
    this.chaseSpeed = 160; 
  }

  upgrade() {
    if (this.isUpgraded) return;
    this.isUpgraded = true;
    this.hp = 5;
    
    this.glowFX = this.preFX.addGlow(0x9900ff, 4, 0, false, 0.1, 10);
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 15, 
        duration: 1200,    
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  ultimateUpgrade() {
    this.upgrade();
    this.isUltimate = true;
    this.hp = 10;
    this.setScale(2.2); // Um pouco maior
    this.detectionRadius = 5000; // Persegue de qualquer lugar
    this.chaseSpeed = 220;
    
    // Aura Preta Ultimate (Glow com cor preta e brilho interno forte)
    if (this.glowFX) this.glowFX.destroy();
    this.glowFX = this.preFX.addGlow(0x000000, 8, 4, false, 0.1, 10);
  }

  static preload(scene) {
    scene.load.spritesheet('flicker_idle', 'assets/Idle_Flicker_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('flicker_weak', 'assets/Weak_Flicker_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('flicker_death', 'assets/Death_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('flicker_idle_anim')) {
      scene.anims.create({
        key: 'flicker_idle_anim',
        frames: scene.anims.generateFrameNumbers('flicker_idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!scene.anims.exists('flicker_weak_anim')) {
      scene.anims.create({
        key: 'flicker_weak_anim',
        frames: scene.anims.generateFrameNumbers('flicker_weak', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!scene.anims.exists('flicker_death_anim')) {
      scene.anims.create({
        key: 'flicker_death_anim',
        frames: scene.anims.generateFrameNumbers('flicker_death', { start: 0, end: 5 }),
        frameRate: 12,
        repeat: 0
      });
    }
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    } else {
      this.play('flicker_weak_anim');
    }
  }

  update(bird) {
    if (this.x < -100) {
      this.destroy(); return;
    }
    if (this.isDead) return;
    if (this.scene.isPaused || this.scene.isGameOver) {
        if (this.body) this.setVelocity(0);
        return;
    }

    if (this.body) {
      if ((this.isUltimate || this.isUpgraded) && bird && !bird.isDead) {
          const distance = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
          if (distance < this.detectionRadius) {
              const angle = Phaser.Math.Angle.Between(this.x, this.y, bird.x, bird.y);
              this.body.setVelocityX(Math.cos(angle) * this.chaseSpeed);
              this.body.setVelocityY(Math.sin(angle) * this.chaseSpeed);
          } else {
              this.body.setVelocityX(-250);
              this.body.setVelocityY(0);
          }
      } else {
          this.body.setVelocityX(-200);
          this.body.setVelocityY(0);
      }
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.scene.bird && !this.scene.bird.isDead) {
      this.scene.bird.gainExperience(this.xpValue, this.scoreValue);
    }
    if (this.body) {
      this.body.setVelocityX(-200);
      this.body.enable = false;
    }
    this.play('flicker_death_anim');
    this.once('animationcomplete-flicker_death_anim', () => {
      this.destroy();
    });
  }
}
