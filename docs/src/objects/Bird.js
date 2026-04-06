import Poop from './Poop.js';

export default class Bird extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bird_fly');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(4); 

    this.play('fly');
    this.baseSpeed = 300; // Velocidade inicial
    this.speed = this.baseSpeed; // Velocidade atual aplicada na física
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
    
    // TABELA DE STATUS DO DASH (Level: {row, scale, cd, dmg, dur})
    this.dashConfig = {
        2: { row: 7, scale: 2, cd: 30000, dmg: 1, dur: 250 },
        3: { row: 6, scale: 3, cd: 25000, dmg: 2, dur: 280 },
        4: { row: 5, scale: 3, cd: 22000, dmg: 3, dur: 310 },
        5: { row: 4, scale: 3, cd: 20000, dmg: 4, dur: 340 },
        6: { row: 3, scale: 4, cd: 17000, dmg: 5, dur: 370 },
        7: { row: 2, scale: 4, cd: 14000, dmg: 6, dur: 400 },
        8: { row: 8, scale: 4, cd: 12000, dmg: 8, dur: 450 },
        9: { row: 9, scale: 4, cd: 10000, dmg: 10, dur: 500 },
        10: { row: 1, scale: 5, cd: 5000, dmg: 15, dur: 600 }
    };

    this.isDashReady = false; 
    this.isDashing = false;
    
    // Aura FX - Inicia desativada (só liga quando tiver dash)
    this.auraFX = this.preFX.addGlow(0xFFFFFF, 0, 0, false, 0.1, 10);
    this.auraFX.active = false; 

    this.isInvincible = false;

    // Altera a hitbox padrão de quadrado para Círculo (Raio 8, pois a imagem original tem 16x16)
    if (this.body) {
        this.body.setAllowGravity(false);
        this.body.setCircle(7, 0, 0); 
    }

    this.shields = 0; 
    this.storedShields = 0; // Novo: contador de escudos guardados
    this.storedHeals = 0; 
    this.healKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

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

    // DANO INICIAL
    this.damage = 1;
  }

  static preload(scene) {
    Poop.preload(scene);
    scene.load.spritesheet('bird_fly', 'assets/BirdFly.png', { 
      frameWidth: 16, 
      frameHeight: 16 
    });
    scene.load.spritesheet('bird_dash_sheet', 'assets/06.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    scene.load.spritesheet('electric_shield', 'assets/Effect_ElectricShield_1_265x265.png', {
      frameWidth: 265,
      frameHeight: 265
    });
    // Ícone do escudo guardado
    scene.load.image('shield_item_icon', 'assets/item556.png');
    // Ícone da cura guardada
    scene.load.image('heal_item_icon', 'assets/item535.png');
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

    // NOVO: Gerador automático de Animações do Dash (Linhas 1 a 9)
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const framesPerRow = 15; // De acordo com as informações (960x576, 15 frames, 9 linhas)

    rows.forEach(row => {
        if (!scene.anims.exists('bird_dash_row_' + row)) {
            scene.anims.create({
                key: 'bird_dash_row_' + row,
                frames: scene.anims.generateFrameNumbers('bird_dash_sheet', { 
                    start: (row - 1) * framesPerRow, 
                    end: (row * framesPerRow) - 1 
                }),
                frameRate: 15,
                repeat: 0
            });
        }
    });
  }

  // Agora apenas guarda o item
  collectShieldItem() {
    if (this.isDead) return;
    this.storedShields++;
    this.scene.events.emit('updateStoredShields', this.storedShields);
  }

  collectHealItem() {
    if (this.isDead) return;
    this.storedHeals++;
    this.scene.events.emit('updateStoredHeals', this.storedHeals);
  }

  useHeal() {
    if (this.isDead || this.storedHeals <= 0 || this.lives >= this.maxLives) return;
    
    this.storedHeals--;
    this.lives = this.lives + 3;
    
    // Efeito visual de cura (Glow verde rápido)
    const healFX = this.preFX.addGlow(0x00ff00, 6, 0, false, 0.1, 10);
    this.scene.time.delayedCall(500, () => {
        if (healFX) healFX.destroy();
    });
    
    this.notifyHUD();
    this.scene.events.emit('updateStoredHeals', this.storedHeals);
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

  // NOVO: Sincroniza o estado do Tori entre as fases
  syncFromData(data) {
    if (!data) return;

    this.level = data.level || this.level;
    this.xp = data.xp || 0;
    this.score = data.score || 0;
    this.ammo = data.ammo || 0;
    this.lives = data.lives || this.lives;
    this.maxLives = data.maxLives || this.maxLives;
    this.storedShields = data.storedShields || 0;
    this.storedHeals = data.storedHeals || 0;
    this.shields = data.shields || 0;

    // Recalcula atributos dependentes do level
    const xpTable = [0, 100, 150, 200, 350, 375, 375, 375, 375, 375, 375];
    this.xpNextLevel = xpTable[this.level] || 99999;
    this.speed = Math.min(this.baseSpeed + ((this.level - 1) * 30), 600);

    // Atualiza Aura e Dash
    if (this.level >= 2) {
      this.isDashReady = true;
      this.auraFX.active = true;
      this.auraFX.outerStrength = Math.min(this.level, 8);
      const colorIndex = Math.min((this.level - 1) * 2, this.goldPalette.length - 1);
      this.auraFX.color = this.goldPalette[colorIndex];
    }

    // Configura Dash Damage
    if (this.dashConfig[Math.min(this.level, 10)]) {
      this.dashDamage = this.dashConfig[Math.min(this.level, 10)].dmg;
    }

    if (this.shields > 0) {
      this.shieldSprite.setVisible(true);
      this.shieldSprite.play('shield_anim');
    }

    this.notifyHUD();
    this.scene.events.emit('updateMaxLives', this.maxLives);
    this.scene.events.emit('updateStoredShields', this.storedShields);
    this.scene.events.emit('updateStoredHeals', this.storedHeals);
    this.scene.events.emit('updateAmmo', this.ammo);
    this.scene.events.emit('updateProgress', {
      score: this.score,
      xp: this.xp,
      level: this.level,
      xpNextLevel: this.xpNextLevel
    });
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
      
      // NOVO: Tabela Fixa de XP. Preserva os rounds iniciais e torna o "Endgame" muito mais difícil.
      const xpTable = [
          0,      // Level 0 (Não usado)
          100,    // Lvl 1 -> 2 (Garantido no Round 1)
          150,    // Lvl 2 -> 3 (Garantido no meio do Round 3)
          200,    // Lvl 3 -> 4 
          350,    // Lvl 4 -> 5 (Dobra a dificuldade)
          375,    // Lvl 5 -> 6 (Requer farmar muito)
          375,   // Lvl 6 -> 7 (O teste final da Fase 1)
          375,   // Lvl 7 -> 8 (Só alcançável na Fase 2)
          375,   // Lvl 8 -> 9
          375,   // Lvl 9 -> 10
          375   // Lvl 10 (Max)
      ];
      
      this.xpNextLevel = xpTable[this.level] || 99999;

      if (this.maxLives < 6) this.maxLives++;
      this.lives = this.maxLives;
      
      // SISTEMA DE AURA COMO INDICADOR DE DASH
      if (this.level >= 2) {
          // Atualiza o quão brilhante é com base no level
          this.auraFX.outerStrength = Math.min(this.level, 8);
          const colorIndex = Math.min((this.level - 1) * 2, this.goldPalette.length - 1);
          this.auraFX.color = this.goldPalette[colorIndex];
          
          // Se acabou de pegar level 2 (ou se já upou com o dash pronto), liga a Aura
          if (!this.isDashReady && !this.isDashing) {
              this.isDashReady = true;
              this.auraFX.active = true;
          }
      } else {
          // Nível inferior a 2: Aura desativada
          this.auraFX.active = false;
      }

      // AUMENTO DINÂMICO DE VELOCIDADE
      // A cada level ele ganha +30 de velocidade, com um limite máximo de 600 (para manter o controle do jogador)
      this.speed = Math.min(this.baseSpeed + ((this.level - 1) * 30), 600);

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

    // 1. Camera Shake (Tremor de tela) para dar peso ao impacto do dano
    this.scene.cameras.main.shake(150, 0.001);

    // 2. Efeito visual de piscar Vermelho Sólido
    let isRed = false;
    
    // Cria um temporizador que roda 10 vezes rápido
    const blinkEvent = this.scene.time.addEvent({
        delay: 100,
        repeat: 9, // Executa 10 vezes total (1 segundo)
        callback: () => {
            if (this.isDead) {
                blinkEvent.remove();
                return;
            }
            
            isRed = !isRed;
            if (isRed) {
                // setTintFill substitui todos os pixels não-transparentes pela cor pura
                this.setTintFill(0xff0000); 
            } else {
                this.clearTint(); 
            }
        }
    });

    // 3. Fim da Invulnerabilidade
    this.scene.time.delayedCall(1000, () => {
        if (!this.isDead) {
            this.isInvincible = false;
            this.clearTint();
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

    // NOVO: Lógica para usar Cura
    if (Phaser.Input.Keyboard.JustDown(this.healKey)) {
        this.useHeal();
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
    // Só usa se for level 2+, estiver pronto, não estiver morto ou pausado
    if (this.level < 2 || !this.isDashReady || this.isDashing || this.isDead || this.scene.isPaused || this.scene.isGameOver) return;

    this.isDashing = true;
    this.isInvincible = true; // Garante i-frames durante o dash
    this.isDashReady = false;
    this.auraFX.active = false; // DESLIGA A AURA (Inicia o Cooldown)

    // Busca a configuração do dash baseada no level atual (Limita a tabela no level 10)
    const currentLevel = Math.min(this.level, 10);
    const config = this.dashConfig[currentLevel];

    // Executa a Animação e a nova Escala
    this.play('bird_dash_row_' + config.row); 
    this.setScale(config.scale);
    
    // ATUALIZAÇÃO: Dano e Duração agora puxam da tabela
    this.dashDamage = config.dmg; 
    const dashDuration = config.dur;
    
    // HITBOX CIRCULAR DURANTE O DASH
    // A imagem do dash tem frame de 64x64. Um círculo de raio 16 (diametro 32) centralizado:
    if (this.body) {
      this.body.setCircle(16, 16, 16); 
    }

    const dashSpeed = 700;

    // Define a velocidade no eixo X com base na direção que está virado (flipX)
    const directionX = (this.flipX) ? -1 : 1;
    if (this.body) {
      this.body.setVelocityX(directionX * dashSpeed);
      this.body.setVelocityY(0); // DASH TOTALMENTE HORIZONTAL
    }

    // FIM DA ANIMAÇÃO DE DASH
    this.scene.time.delayedCall(dashDuration, () => {
      if (this.active && !this.isDead) {
        this.isDashing = false;
        this.isInvincible = false; // Perde a invulnerabilidade ao fim do dash
        if (this.body) this.setVelocity(0, 0);
        
        // Retorna pro voo normal, escala padrão (4) e hitbox circular de raio 8 (BirdFly.png 16x16)
        this.play('fly');
        this.setScale(4);
        if (this.body) {
          this.body.setCircle(8, 0, 0);
        }
        
        // INICIA O TEMPO DE RECARGA (COOLDOWN)
        this.scene.time.delayedCall(config.cd, () => {
            if (this.active && !this.isDead) {
                this.isDashReady = true;
                this.auraFX.active = true; // RELIGA A AURA! Dash Pronto!
            }
        });
      }
    });
  }

  shootPoop() {
    const currentTime = this.scene.time.now;
    if (this.ammo > 0 && currentTime > this.lastShootTime + this.shootDelay && this.scene.isGameStarted && !this.isDead) {
      this.ammo--;
      this.lastShootTime = currentTime;
      const poop = new Poop(this.scene, this.x, this.y + 15, this.body.velocity.x, this.level);
      if (this.scene.poops) {
        this.scene.poops.add(poop);
      }
      this.scene.events.emit('updateAmmo', this.ammo);
    }
  }
}
