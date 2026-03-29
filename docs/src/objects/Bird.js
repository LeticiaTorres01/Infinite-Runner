import Poop from './Poop.js';

export default class Bird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bird_fly');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(3); 

    if (this.body) {
      this.body.setAllowGravity(false);
    }

    this.play('fly');
    this.speed = 300; 
    this.isDead = false;
    
    // SISTEMA DE VIDAS
    this.lives = 3;
    this.isInvincible = false;
    this.shields = 0; 
    this.storedShields = 0; // Novo: contador de escudos guardados

    // ESCUDO VISUAL
    this.shieldSprite = scene.add.sprite(x, y, 'electric_shield');
    this.shieldSprite.setScale(0.5);
    this.shieldSprite.setVisible(false);
    this.shieldSprite.setDepth(this.depth + 1);

    // SISTEMA DE MUNIÇÃO
    this.ammo = 10;
    this.maxAmmo = 30; // Limite máximo de coco
    this.lastShootTime = 0;
    this.shootDelay = 500;

    // SISTEMA DE PONTUAÇÃO E XP
    this.score = 0;
    this.xp = 0;
    this.level = 1;
    this.xpNextLevel = 100;

    // Tecla para usar escudo
    this.shieldKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }

  static preload(scene) {
    Poop.preload(scene);
    scene.load.spritesheet('bird_fly', 'assets/BirdFly.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    scene.load.spritesheet('electric_shield', 'assets/Effect_ElectricShield_1_265x265.png', {
      frameWidth: 265,
      frameHeight: 265
    });
    // Ícone do escudo guardado
    scene.load.image('shield_item_icon', 'assets/item556.png');
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('fly')) {
        scene.anims.create({
          key: 'fly',
          frames: scene.anims.generateFrameNumbers('bird_fly', { start: 0, end: 7 }),
          frameRate: 10,
          repeat: -1
        });
    }

    if (!scene.anims.exists('shield_anim')) {
        scene.anims.create({
          key: 'shield_anim',
          frames: scene.anims.generateFrameNumbers('electric_shield', { start: 0, end: 29 }),
          frameRate: 20,
          repeat: -1
        });
    }
  }

  // Agora apenas guarda o item
  collectShieldItem() {
    if (this.isDead) return;
    this.storedShields++;
    this.scene.events.emit('updateStoredShields', this.storedShields);
  }

  useShield() {
    if (this.isDead || this.storedShields <= 0 || this.shields > 0) return;
    
    this.storedShields--;
    this.shields = 3;
    this.shieldSprite.setVisible(true);
    this.shieldSprite.play('shield_anim');
    this.setTint(0x00ffff);
    
    this.notifyHUD();
    this.scene.events.emit('updateStoredShields', this.storedShields);
  }

  activateShield() {
    // Método mantido para compatibilidade se necessário, mas agora usamos collectShieldItem
    this.collectShieldItem();
  }

  deactivateShield() {
    this.shields = 0;
    this.shieldSprite.setVisible(false);
    this.shieldSprite.stop();
    this.clearTint();
    this.notifyHUD();
  }

  notifyHUD() {
    this.scene.events.emit('updateLives', { lives: this.lives, shields: this.shields });
  }

  gainAmmo(amount) {
    if (this.isDead) return;
    this.ammo += amount;
    if (this.ammo > this.maxAmmo) this.ammo = this.maxAmmo;
    this.scene.events.emit('updateAmmo', this.ammo);
  }

  gainExperience(amountXP, amountScore) {
    if (this.isDead) return;

    this.score += amountScore;
    this.xp += amountXP;

    if (this.xp >= this.xpNextLevel) {
      this.level++;
      this.xp -= this.xpNextLevel;
      this.scene.events.emit('levelUp', this.level);
    }

    this.scene.events.emit('updateProgress', {
      score: this.score,
      xp: this.xp,
      level: this.level,
      xpNextLevel: this.xpNextLevel
    });
  }

  takeDamage() {
    if (this.isDead || this.isInvincible) return;

    if (this.shields > 0) {
        this.shields--;
        if (this.shields <= 0) {
            this.shieldSprite.setVisible(false);
            this.shieldSprite.stop();
            this.clearTint();
        }
        this.notifyHUD();
        this.startInvincibility();
        return;
    }

    this.lives--;
    this.notifyHUD();
    
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
    this.shields = 0;
    if (this.shieldSprite) this.shieldSprite.setVisible(false);
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
    if (this.shields > 0 && this.shieldSprite) {
        this.shieldSprite.setPosition(this.x, this.y);
    }
  }

  update(cursors) {
    if (this.isDead) {
        if (this.shieldSprite) this.shieldSprite.setVisible(false);
        return;
    } 
    this.setVelocity(0);

    // Lógica para usar escudo
    if (Phaser.Input.Keyboard.JustDown(this.shieldKey)) {
        this.useShield();
    }

    if (this.shields > 0 && this.shieldSprite) {
        this.shieldSprite.setPosition(this.x, this.y);
    }

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
