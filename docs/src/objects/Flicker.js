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
    this.hp = 1;
    this.xpValue = 5;
    this.scoreValue = 50;
    this.isDead = false;

    this.isUpgraded = false;
    this.detectionRadius = 290; // Distância 'X' em pixels que ele enxerga o pássaro
    this.chaseSpeed = 160; // Velocidade lenta de perseguição
  }

  upgrade() {
    this.isUpgraded = true;
    this.hp = 2;
    
    // Aura Roxa Fantasmagórica
    this.glowFX = this.preFX.addGlow(0x9900ff, 4, 0, false, 0.1, 10);
    
    // Tween de pulsação lenta e sombria
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 15, // Expande bastante
        duration: 1200,    // Movimento lento de respiração
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
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
      this.destroy();
      return;
    }

    if (this.scene.isPaused || this.scene.isGameOver) {
      if (this.body) {
          this.body.setVelocityX(0);
          this.body.setVelocityY(0);
      }
      return;
    }

    if (this.body && !this.isDead) {
      // Lógica de perseguição do Flicker Evoluído
      if (this.isUpgraded && bird && !bird.isDead) {
          const distance = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
          
          if (distance < this.detectionRadius) {
              // Pássaro muito perto: Move na direção do pássaro lentamente
              const angle = Phaser.Math.Angle.Between(this.x, this.y, bird.x, bird.y);
              this.body.setVelocityX(Math.cos(angle) * this.chaseSpeed);
              this.body.setVelocityY(Math.sin(angle) * this.chaseSpeed);
          } else {
              // Fora da distância: Voa reto para a esquerda normalmente
              this.body.setVelocityX(-250); // Levemente mais rápido que o Flicker normal
              this.body.setVelocityY(0);
          }
      } else {
          // Flicker Normal (Sempre reto)
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
