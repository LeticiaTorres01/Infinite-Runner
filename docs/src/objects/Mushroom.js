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

    this.hp = 8;
    this.xpValue = 20; // REDUZIDO DE 40 PARA 20
    this.scoreValue = 100;
    this.isDead = false;
    
    this.currentState = 'WALKING';
    
    const centerX = scene.scale.width / 2;
    this.direction = (x < centerX) ? 1 : -1;
    this.setFlipX(this.direction === 1);
    
    this.walkSpeed = 150;
    this.jumpPowerY = -1300; 
    this.jumpPowerX = 180;
    
    this.walkTimer = 0;
    this.walkDuration = 1500; 
    this.stunTimer = 0;
    this.stunDuration = 1000;
    this.jumpCount = 0;

    this.maxBounces = 1; // Rebate apenas uma vez antes de sair
    this.bounceCount = 0;

    this.play('mushroom_run_anim');

    this.isUpgraded = false;
    this.isUltimate = false;
  }

  upgrade() {
    if (this.isUpgraded) return;
    this.isUpgraded = true;
    this.hp = 12; // REDUZIDO DE 20 PARA 12 (4 hits de Dash no Level 4)
    this.stunDuration = 500; 
    
    this.glowFX = this.preFX.addGlow(0xff8800, 4, 1, false, 0.1, 10);
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 10,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  ultimateUpgrade() {
    this.upgrade();
    this.isUltimate = true;
    this.hp = 35;
    this.walkSpeed = 220;
    
    // Aura Roxa Ultimate
    if (this.glowFX) this.glowFX.destroy();
    this.glowFX = this.preFX.addGlow(0x9900ff, 6, 2, false, 0.1, 10);
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
        scene.anims.create({ key: 'mushroom_stun_anim', frames: scene.anims.generateFrameNumbers('mushroom_stun', { start: 0, end: 7 }), frameRate: 10, repeat: -1 });
    }
  }

  takeDamage(amount = 1) {
    if (!this.active || this.isDead) return;
    
    this.hp -= amount;
    if (this.hp <= 0) {
        this.die();
    } else {
        // Versão Ultimate não fica atordoada
        if (this.isUltimate) {
            this.setTint(0xff0000);
            this.scene.time.delayedCall(100, () => this.clearTint());
            return;
        }
        this.currentState = 'STUNNED';
        this.stunTimer = this.stunDuration;
        this.jumpCount = 0; 
        
        // CORREÇÃO: Para o pulo imediatamente e é levado pelo mapa
        this.body.setVelocityY(0);
        this.body.setVelocityX(-200); 
        
        this.play('mushroom_stun_anim', true);
    }
  }

  update(bird, time, delta) {
    if (!this.active) return;
    if (this.isDead) {
        if (this.x < -300 || this.x > this.scene.scale.width + 300 || this.y > this.scene.scale.height + 200) {
            this.destroy();
        }
        return;
    }

    const onGround = this.body && (this.body.blocked.down || this.body.touching.down);
    const screenWidth = this.scene.scale.width;

    if (this.bounceCount < this.maxBounces) {
        if (this.x < 100 && this.direction === -1) {
            this.direction = 1; this.bounceCount++; this.setFlipX(true);
        } else if (this.x > screenWidth - 100 && this.direction === 1) {
            this.direction = -1; this.bounceCount++; this.setFlipX(false);
        }
    }

    switch (this.currentState) {
        case 'STUNNED':
            // CORREÇÃO: Mantém sendo levado pelo mapa enquanto atordoado
            this.body.setVelocityX(-200);
            
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.currentState = 'WALKING';
                this.walkTimer = this.walkDuration;
                this.play('mushroom_run_anim');
                this.body.setVelocityX(0); 
            }
            break;

        case 'WALKING':
            if (onGround) {
                this.body.setVelocityX(this.walkSpeed * this.direction);
                if (this.anims.currentAnim && this.anims.currentAnim.key !== 'mushroom_run_anim') {
                    this.play('mushroom_run_anim');
                }
            }
            
            this.walkTimer -= delta;
            if (this.walkTimer <= 0 && onGround) {
                this.currentState = 'JUMPING';
                this.jumpCount = 1; // Primeiro pulo
                this.body.setVelocityY(this.jumpPowerY);
                this.body.setVelocityX(this.jumpPowerX * this.direction);
                this.play('mushroom_attack_anim');
            }
            break;

        case 'JUMPING':
            this.body.setVelocityX(this.jumpPowerX * this.direction);

            if (onGround && this.body.velocity.y >= 0) {
                const maxJumps = this.isUltimate ? 3 : (this.isUpgraded ? 2 : 1);
                
                if (this.jumpCount < maxJumps) {
                    // Pula novamente imediatamente ao tocar o chão
                    this.jumpCount++;
                    // O segundo e terceiro pulos são progressivamente mais altos (1.3x e 1.5x)
                    // Agora o jumpCount será 2 para o segundo pulo e 3 para o terceiro
                    const powerMult = this.jumpCount === 2 ? 1.3 : 1.5;
                    this.body.setVelocityY(this.jumpPowerY * powerMult);
                    this.body.setVelocityX(this.jumpPowerX * this.direction);
                    this.play('mushroom_attack_anim', true);
                } else {
                    // Terminou a sequência de pulos
                    this.currentState = 'WALKING';
                    this.jumpCount = 0;
                    this.walkTimer = this.isUltimate ? 300 : (this.isUpgraded ? 800 : 1500); 
                    this.play('mushroom_run_anim');
                }
            }
            break;
    }

    if (this.x < -1000 || this.x > screenWidth + 1000) this.destroy();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.scene.bird && !this.scene.bird.isDead) {
        this.scene.bird.gainExperience(this.xpValue, this.scoreValue);
    }
    if (this.body) {
        this.body.setAllowGravity(true);
        this.body.setVelocityX(-200); 
    }
    this.play('mushroom_die_anim');
  }
}
