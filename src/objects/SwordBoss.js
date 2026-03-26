export default class SwordBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'sword_boss');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(3);
    this.setDepth(100);
    
    // NOVO: Define o centro de massa no corpo do personagem (pixel 27 de 128)
    this.setOrigin(27 / 128, 0.5); 
    
    if (this.body) {
      this.body.setAllowGravity(true);
      this.body.setGravityY(1000);
      
      // Hitbox baseada no corpo real (26px de largura)
      this.body.setSize(26, 37); 
      this.body.setOffset(14, 27); 
    }

    this.hp = 50;
    this.maxHp = 50;
    this.isDead = false;
    this.isTurning = false; // TRAVA PARA VIRADA SUAVE
    this.state = 'IDLE'; 
    this.attackCooldown = 2000;
    this.isInvulnerable = false;

    if (scene.anims.exists('boss_idle')) {
        this.play('boss_idle');
    }
    
    this.createHealthBar();
  }

  createHealthBar() {
    this.barBg = this.scene.add.rectangle(this.scene.scale.width / 2, 50, 600, 20, 0x333333).setScrollFactor(0).setDepth(1000);
    this.bar = this.scene.add.rectangle(this.scene.scale.width / 2 - 300, 50, 600, 20, 0xff0000).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
    this.bossName = this.scene.add.text(this.scene.scale.width / 2, 25, 'KAGE NO KEN - SWORD MASTER', { 
        fontSize: '24px', 
        fontFamily: 'KenneyRocket', 
        fill: '#fff' 
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
  }

  updateHealthBar() {
    if (!this.bar) return;
    const percentage = Math.max(0, this.hp / this.maxHp);
    this.bar.width = 600 * percentage;
  }

  static preload(scene) {
    // Voltou para 128x64 (14 colunas por linha)
    scene.load.spritesheet('sword_boss', 'assets/Sword.png', { 
      frameWidth: 128, 
      frameHeight: 64 
    });
  }

  static createAnimations(scene) {
    // Linha 1: 7 frames úteis (0 a 6)
    if (!scene.anims.exists('boss_idle')) {
      scene.anims.create({
        key: 'boss_idle',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 0, end: 6 }),
        frameRate: 10,
        repeat: -1
      });
    }

    // Linha 2 (Caminhada): 4 frames úteis (14 a 17)
    if (!scene.anims.exists('boss_walk')) {
      scene.anims.create({
        key: 'boss_walk',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 14, end: 17 }),
        frameRate: 8,
        repeat: -1
      });
    }

    // Linha 3 (Corrida): 8 frames úteis (28 a 35)
    if (!scene.anims.exists('boss_run')) {
      scene.anims.create({
        key: 'boss_run',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 28, end: 35 }),
        frameRate: 12,
        repeat: -1
      });
    }

    // Linha 4 (Dash): 7 frames úteis (42 a 48)
    if (!scene.anims.exists('boss_dash')) {
      scene.anims.create({
        key: 'boss_dash',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 42, end: 48 }),
        frameRate: 15,
        repeat: -1
      });
    }

    // Linha 5 (Ataque Giratório): 14 frames úteis (56 a 69)
    if (!scene.anims.exists('boss_spin_attack')) {
      scene.anims.create({
        key: 'boss_spin_attack',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 56, end: 69 }),
        frameRate: 15,
        repeat: 0
      });
    }

    // Linha 6 (Ataque Pesado): 7 frames úteis (70 a 76)
    if (!scene.anims.exists('boss_heavy_attack')) {
      scene.anims.create({
        key: 'boss_heavy_attack',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 70, end: 76 }),
        frameRate: 15,
        repeat: 0
      });
    }

    // Linha 7 (Teleporte/Esquiva): 2 frames úteis (84 a 85)
    if (!scene.anims.exists('boss_teleport')) {
      scene.anims.create({
        key: 'boss_teleport',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 84, end: 85 }),
        frameRate: 10,
        repeat: 0
      });
    }

    // Linha 8 (Morte): 9 frames úteis (98 a 106)
    if (!scene.anims.exists('boss_die')) {
      scene.anims.create({
        key: 'boss_die',
        frames: scene.anims.generateFrameNumbers('sword_boss', { start: 98, end: 106 }),
        frameRate: 12,
        repeat: 0
      });
    }
  }

  update(bird, time, delta) {
    if (this.isDead || !this.active) return;

    // 1. LÓGICA DE ESPELHAMENTO COM TWEEN (SUAVE - ESTILO PAPER MARIO)
    if (bird && !bird.isDead && this.state !== 'ATTACKING' && this.state !== 'TELEPORTING') {
        const shouldFlip = bird.x < this.x;
        
        if (this.flipX !== shouldFlip && !this.isTurning) {
            this.isTurning = true;
            this.scene.tweens.add({
                targets: this,
                scaleX: 0,
                duration: 80,
                ease: 'Linear',
                onComplete: () => {
                    this.setFlipX(shouldFlip);
                    this.setOrigin(shouldFlip ? (101 / 128) : (27 / 128), 0.5);
                    this.scene.tweens.add({
                        targets: this,
                        scaleX: 3, 
                        duration: 80,
                        ease: 'Linear',
                        onComplete: () => {
                            this.isTurning = false; 
                        }
                    });
                }
            });
        }
    }

    // 2. AJUSTE DA HITBOX (Apenas quando não estiver no meio do giro)
    if (this.body && !this.isTurning) {
        const isFlipped = this.flipX;
        const offsetX = isFlipped ? 88 : 14; 
        const h = 22; 
        const offsetY = 30; 

        const anim = this.anims.currentAnim?.key;

        if (anim === 'boss_heavy_attack') {
            this.body.setSize(50, h);
            this.body.setOffset(isFlipped ? 64 : 14, offsetY); 
        } else if (anim === 'boss_spin_attack') {
            this.body.setSize(64, h);
            this.body.setOffset(isFlipped ? 50 : 14, offsetY); 
        } else {
            this.body.setSize(20, h); 
            this.body.setOffset(offsetX, offsetY);
        }
    }

    // 3. IA e Cooldowns...
    if (this.state === 'IDLE' || this.state === 'CHASING') {
        this.attackCooldown -= delta;
        this.aiLogic(bird, delta);
    }
    
    this.updateHealthBar();
  }

  aiLogic(bird, delta) {
    if (!bird || bird.isDead) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);

    if (this.attackCooldown <= 0) {
        if (dist < 150) {
            this.performSpinAttack();
        } else if (dist < 400) {
            this.performHeavyAttack();
        } else {
            this.performTeleport(bird);
        }
        return;
    }

    // Movimentação real usando as animações validadas
    if (dist > 150 && this.state !== 'ATTACKING') {
        this.state = 'CHASING';
        this.play('boss_run', true);
        const dir = bird.x > this.x ? 1 : -1;
        this.body.setVelocityX(dir * 200);
    } else if (dist < 100 && this.state !== 'ATTACKING') {
        this.state = 'IDLE';
        this.play('boss_idle', true);
        this.body.setVelocityX(0);
    }
  }

  performSpinAttack() {
    this.state = 'ATTACKING';
    this.body.setVelocityX(0);
    this.play('boss_spin_attack');
    this.once('animationcomplete', () => {
        this.state = 'IDLE';
        this.attackCooldown = 2000;
    });
  }

  performHeavyAttack() {
    this.state = 'ATTACKING';
    const dir = this.flipX ? 1 : -1;
    this.body.setVelocityX(dir * 400); // Avanço rápido no ataque
    this.play('boss_heavy_attack');
    this.once('animationcomplete', () => {
        this.state = 'IDLE';
        this.attackCooldown = 1500;
    });
  }

  performTeleport(bird) {
    this.state = 'TELEPORTING';
    this.isInvulnerable = true;
    this.play('boss_teleport');
    
    this.once('animationcomplete', () => {
        this.setAlpha(0);
        this.scene.time.delayedCall(500, () => {
            if (this.isDead) return;
            // Teleporta para trás do pássaro ou perto dele
            this.x = bird.x + (bird.flipX ? 200 : -200);
            this.y = bird.y;
            this.setAlpha(1);
            this.playReverse('boss_teleport');
            this.once('animationcomplete', () => {
                this.isInvulnerable = false;
                this.state = 'IDLE';
                this.attackCooldown = 500;
            });
        });
    });
  }

  takeDamage() {
    if (this.isDead || this.isInvulnerable) return;
    
    this.hp--;
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.body.setVelocity(0);
    this.body.setEnable(false);
    this.play('boss_die');
    
    if (this.bar) this.bar.destroy();
    if (this.barBg) this.barBg.destroy();
    if (this.bossName) this.bossName.destroy();

    this.once('animationcomplete', () => {
        this.scene.time.delayedCall(2000, () => {
            this.destroy();
            // Poderia disparar evento de vitória aqui
        });
    });
  }
}
