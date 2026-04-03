import Poop from './Poop.js';

export default class Bird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bird_fly');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(4); 

    if (this.body) {
      this.body.setAllowGravity(false);
    }

    this.play('fly');
    this.speed = 300; 
    this.isDead = false;
    
    // SISTEMA DE VIDAS
    this.lives = 3;
    this.maxLives = 3; // Limite dinâmico que cresce com o level

    // PALETA DE OURO (Branco -> Dourado Forte)
    this.goldPalette = [
        0xFFFFFF, 0xFEF9E4, 0xFEF4CA, 0xFEEEB1, 0xFDE997, 
        0xFDE37D, 0xFDDE63, 0xFDD949, 0xFCD330, 0xFCCE16
    ];
    this.isMaxLevelGlow = false;
    this.glowStep = 0; 
    
    // Cria uma Aura FX nativa do Phaser (Cor, Força Externa, Força Interna)
    // Começa invisível (Força 0)
    this.auraFX = this.preFX.addGlow(0xFFFFFF, 0, 0, false, 0.1, 10);

    this.isInvincible = false;
    this.shields = 0; 
    this.storedShields = 0; // Novo: contador de escudos guardados

    // HABILIDADE DE DASH/ATAQUE ESPECIAL
    this.canDash = false; // Ativado no Level 3
    this.isDashing = false;
    this.dashDamage = 1; // Começa com 1 no Level 3
    this.dashAnimationRow = 7; // Começa com a linha 7 do spritesheet 06.png
    this.dashKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

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
    scene.load.spritesheet('bird_dash', 'assets/06.png', {
      frameWidth: 64,
      frameHeight: 64
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

    // Dash animations for rows 1 and 7 (15 frames per row)
    if (!scene.anims.exists('bird_dash_row_7')) {
      scene.anims.create({
        key: 'bird_dash_row_7',
        frames: scene.anims.generateFrameNumbers('bird_dash', { start: 6 * 15, end: 6 * 15 + 14 }), 
        frameRate: 10,
        repeat: -1
      });
    }
    if (!scene.anims.exists('bird_dash_row_1')) {
      scene.anims.create({
        key: 'bird_dash_row_1',
        frames: scene.anims.generateFrameNumbers('bird_dash', { start: 0, end: 14 }), 
        frameRate: 10,
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
      
      if (this.maxLives < 6) this.maxLives++;
      this.lives = this.maxLives;
      
      // SISTEMA DE AURA E HABILIDADE (GLOW E DASH)
      if (this.level < 7) {
          this.auraFX.outerStrength = this.level - 1;
          const colorIndex = Math.min((this.level - 1) * 2, this.goldPalette.length - 1);
          this.auraFX.color = this.goldPalette[colorIndex];
          
          // PROGRESSÃO DA HABILIDADE DE DASH
          if (this.level >= 3) {
              this.canDash = true;
              // Aumenta o dano suavemente
              this.dashDamage = this.level - 1; 
              
              // Muda a animação (line 7 para levels 3-6)
              this.dashAnimationRow = 7;
          }
      } else {
          // Nível 7 em diante (Evolução Final)
          this.startGoldGlow();
          
          // Dano Máximo e Animação Final (line 1)
          this.canDash = true;
          this.dashDamage = 5;
          this.dashAnimationRow = 1; // Agora usa a animação da linha 1
      }

      this.scene.events.emit('updateMaxLives', this.maxLives);
      this.notifyHUD();
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

  startGoldGlow() {
    if (this.isMaxLevelGlow) return;
    this.isMaxLevelGlow = true;

    // Tween 1: Faz a Aura pulsar de tamanho (respiração)
    this.scene.tweens.add({
        targets: this.auraFX,
        outerStrength: 8, // Fica bem expansiva
        innerStrength: 2, // Brilha por dentro também
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Tween 2: Faz a cor da Aura ciclar por toda a sua paleta de ouro
    this.scene.tweens.add({
        targets: this,
        glowStep: this.goldPalette.length - 1,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => {
            const index = Math.round(this.glowStep);
            this.auraFX.color = this.goldPalette[index];
        }
    });
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

    // Lógica para usar escudo
    if (Phaser.Input.Keyboard.JustDown(this.shieldKey)) {
        this.useShield();
    }

    // Lógica para usar Dash
    if (Phaser.Input.Keyboard.JustDown(this.dashKey)) {
        this.startDash();
    }

    if (this.isDashing) {
        if (this.shieldSprite) this.shieldSprite.setPosition(this.x, this.y);
        return; 
    }

    this.setVelocity(0);

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

  startDash() {
    if (!this.canDash || this.isDashing || this.isDead || this.scene.isPaused || this.scene.isGameOver) return;

    this.isDashing = true;
    this.dashTime = this.scene.time.now;
    this.setScale(2); // Reduz escala para compensar o tamanho do sprite dash (64x64 vs 16x16)
    
    // Animação de Dash específica (use a spritesheet 06.png e a linha definida)
    this.play('bird_dash_row_' + this.dashAnimationRow); 

    const dashSpeed = 800; // Alta velocidade
    const duration = 500; // Curta duração

    // Define a velocidade no eixo X com base na direção que está virado
    const directionX = (this.flipX) ? -1 : 1;
    this.body.setVelocityX(directionX * dashSpeed);
    this.body.setVelocityY(0); // Dash puramente horizontal

    this.scene.time.delayedCall(duration, () => {
      if (this.active && !this.isDead) {
        this.isDashing = false;
        this.setVelocity(0, 0);
        this.clearTint();
        this.setScale(4); // Restaura escala original (4x16 = 64)
        this.play('fly');
      }
    });
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
