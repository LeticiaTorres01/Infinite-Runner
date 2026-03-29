import Poop from './Poop.js';

export default class Bird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bird_fly');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(3); 
    this.setCollideWorldBounds(true); 

    if (this.body) {
      this.body.setAllowGravity(false);
    }

    this.play('fly');
    this.speed = 300; 
    this.isDead = false;
    
    // SISTEMA DE VIDAS
    this.lives = 3;
    this.isInvincible = false;

    // SISTEMA DE MUNIÇÃO
    this.ammo = 10;
    this.lastShootTime = 0;
    this.shootDelay = 500;

    // SISTEMA DE PONTUAÇÃO E XP
    this.score = 0;
    this.xp = 0;
    this.level = 1;
    this.xpNextLevel = 100;
  }

  static preload(scene) {
    Poop.preload(scene);
    scene.load.spritesheet('bird_fly', 'assets/BirdFly.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });
  }

  static createAnimations(scene) {
    scene.anims.create({
      key: 'fly',
      frames: scene.anims.generateFrameNumbers('bird_fly', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1
    });
  }

  gainExperience(amountXP, amountScore) {
    if (this.isDead) return;

    this.score += amountScore;
    this.xp += amountXP;

    // Lógica de Level Up
    if (this.xp >= this.xpNextLevel) {
      this.level++;
      this.xp -= this.xpNextLevel;
      // Notifica Level Up (pode adicionar efeito sonoro ou visual depois)
      this.scene.events.emit('levelUp', this.level);
    }

    // Notifica a cena para atualizar o HUD
    this.scene.events.emit('updateProgress', {
      score: this.score,
      xp: this.xp,
      level: this.level,
      xpNextLevel: this.xpNextLevel
    });
  }

  takeDamage() {
    if (this.isDead || this.isInvincible) return;
    this.lives--;
    this.scene.events.emit('updateLives', this.lives);
    if (this.lives <= 0) {
      this.die();
    } else {
      this.startInvincibility();
    }
  }

  startInvincibility() {
    this.isInvincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 100,
      ease: 'Linear',
      yoyo: true,
      repeat: 10,
      onComplete: () => {
        this.isInvincible = false;
        this.alpha = 1;
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.anims.stop();
    this.setFrame(0); 
    this.setTint(0xff0000);
    this.setAngle(90);
    this.setVelocityX(0);
    if (this.body) {
      this.body.setAllowGravity(true);
      this.body.setGravityY(1000); 
      this.body.checkCollision.none = true;
    }
    this.setCollideWorldBounds(false);
  }

  idleFloating(time) {
    if (this.isDead) return;
    this.y += Math.sin(time / 200) * 0.5;
  }

  update(cursors) {
    if (this.isDead) return; 
    this.setVelocity(0);

    if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
      this.shootPoop();
    }
    
    if (cursors.left.isDown) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
    }

    if (cursors.up.isDown) {
      this.setVelocityY(-this.speed);
    } else if (cursors.down.isDown) {
      this.setVelocityY(this.speed);
    }
  }

  shootPoop() {
    const currentTime = this.scene.time.now;
    if (this.ammo > 0 && currentTime > this.lastShootTime + this.shootDelay && this.scene.isGameStarted && !this.isDead) {
      this.ammo--;
      this.lastShootTime = currentTime;
      const poop = new Poop(this.scene, this.x, this.y + 15, this.body.velocity.x);
      if (this.scene.poops) {
        this.scene.poops.add(poop);
      }
      this.scene.events.emit('updateAmmo', this.ammo);
    }
  }
}
