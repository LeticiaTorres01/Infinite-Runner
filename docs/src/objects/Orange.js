export default class Orange extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'orange_idle');
    
    this.setScale(3.5); 
    this.setOrigin(0.5, 1); 
    this.setDepth(12);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.texture) {
      this.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    if (this.body) {
      this.body.setCollideWorldBounds(false);
      this.body.onWorldBounds = false; 
      this.body.setMaxVelocity(1000, 2000);
      this.body.setCircle(10, 5, 11); 
    }

    this.hp = 19;
    this.xpValue = 50;
    this.scoreValue = 150;
    this.isDead = false;
    this.isAttacking = false; 
    this.isSleeping = false;
    this.isBraking = false;
    this.hasJumped = false;
    this.isStunned = false;
    this.stunTimer = 0;
    this.jumpCount = 0; 
    this.isSpecialJumping = false; 

    this.isUpgraded = false; 
    this.baseSpeed = 320;
    this.acceleration = 0.005; 
    
    // Cooldown de ataque: Versão normal demora um pouco mais para atacar novamente
    this.attackCooldown = Phaser.Math.Between(2000, 4000);
    this.sleepChance = 0.7; 
    
    const centerX = scene.scale.width / 2;
    this.patrolDirection = (x < centerX) ? 1 : -1;
    this.setFlipX(this.patrolDirection < 0);

    this.patrolSpeedJitter = Phaser.Math.Between(0, 45);
    this.nextPatrolTurnAt = scene.time.now + Phaser.Math.Between(1400, 2600);
    this.patrolBoundaryLeft = 120;
    this.patrolBoundaryRight = scene.scale.width - 120;
    
    this.play('orange_walk_anim');
  }

  upgrade() {
    this.isUpgraded = true;
    this.hp = 26; 
    
    // Aura Roxa Fininha (Padrão de evolução)
    this.glowFX = this.preFX.addGlow(0x9900ff, 1, 0, false, 0.1, 10);
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  ultimateUpgrade() {
    this.isUpgraded = true;
    this.hp = 30; // Muito mais resistente
    this.baseSpeed = 500; // Bem mais rápido
    this.acceleration = 0.01;
    this.xpValue = 150;
    this.scoreValue = 500;
    
    // Aura Dourada/Rosa (Padrão Ultimate)
    if (this.glowFX) this.glowFX.destroy();
    this.glowFX = this.preFX.addGlow(0xe600ac, 4, 0, false, 0.2, 12);
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 8,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  static preload(scene) {
    const sprites = [
      { key: 'orange_idle', path: 'assets/Orange_Idle.png' },
      { key: 'orange_walk', path: 'assets/Orange_Walk.png' },
      { key: 'orange_jump', path: 'assets/Orange_Jump.png' },
      { key: 'orange_hit', path: 'assets/Orange_Hit.png' },
      { key: 'orange_rolling', path: 'assets/Orange_Rolling.png' },
      { key: 'orange_roll_start', path: 'assets/Orange_Roll_Start.png' },
      { key: 'orange_sleep', path: 'assets/Orange_Sleep.png' },
      { key: 'orange_recover', path: 'assets/Orange_Recover.png' },
      { key: 'orange_death', path: 'assets/Orange_Death.png' }
    ];

    sprites.forEach(s => {
      scene.load.spritesheet(s.key, s.path, { frameWidth: 32, frameHeight: 32 });
    });
  }

  static createAnimations(scene) {
    const anims = [
      { key: 'orange_idle_anim', texture: 'orange_idle', end: 1, rate: 4, repeat: -1 },
      { key: 'orange_walk_anim', texture: 'orange_walk', end: 3, rate: 8, repeat: -1 },
      { key: 'orange_jump_anim', texture: 'orange_jump', end: 0, rate: 1, repeat: 0 },
      { key: 'orange_hit_anim', texture: 'orange_hit', end: 1, rate: 10, repeat: 0 },
      { key: 'orange_rolling_anim', texture: 'orange_rolling', end: 4, rate: 15, repeat: -1 },
      { key: 'orange_roll_start_anim', texture: 'orange_roll_start', end: 0, rate: 1, repeat: 0 },
      { key: 'orange_sleep_anim', texture: 'orange_sleep', end: 1, rate: 2, repeat: -1 },
      { key: 'orange_recover_anim', texture: 'orange_recover', end: 2, rate: 10, repeat: 0 },
      { key: 'orange_death_anim', texture: 'orange_death', end: 1, rate: 5, repeat: 0 }
    ];

    anims.forEach(a => {
      if (!scene.anims.exists(a.key)) {
        scene.anims.create({
          key: a.key,
          frames: scene.anims.generateFrameNumbers(a.texture, { start: 0, end: a.end }),
          frameRate: a.rate,
          repeat: a.repeat
        });
      }
    });
  }

  takeDamage(amount = 1) {
    if (!this.active || this.isDead) return;
    
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    } else {
      // Se NÃO for evoluído e estiver dormindo, ele NÃO acorda ao tomar dano (vulnerável)
      if (!this.isUpgraded && this.isSleeping) {
          this.setTint(0xff0000);
          this.scene.time.delayedCall(100, () => this.clearTint());
          return; 
      }

      this.isStunned = true;
      this.stunTimer = 450;
      this.isAttacking = false;
      this.isSleeping = false;
      this.isBraking = false;
      this.hasJumped = false;
      if (this.body) {
          this.body.setVelocity(0, 0);
      }
      this.clearTint();
      this.play('orange_hit_anim');
      this.once('animationcomplete', () => {
        if (this.active && !this.isDead) {
          this.play('orange_recover_anim');
          this.once('animationcomplete', () => {
             if (this.active && !this.isDead) {
               this.setTexture('orange_idle');
               this.play('orange_walk_anim');
             }
          });
        }
      });
    }
  }

  update(bird, time, delta) {
    if (!this.active || this.isDead) return;

    if (this.x < -1200 || this.x > this.scene.scale.width + 1200 || this.y > this.scene.scale.height + 600) {
      this.destroy();
      return;
    }

    if (this.scene.isPaused || this.scene.isGameOver) {
      if (this.body) this.body.setVelocityX(-200); 
      return;
    }

    const onGround = this.body && (this.body.blocked.down || this.body.touching.down);

    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      } else {
        if (this.body) this.body.setVelocityX(0);
        return;
      }
    }

    // Lógica de Sono
    if (this.isSleeping) {
        this.body.setVelocityX(-200); // Drifta com o cenário

        // Condições para acordar
        const hitLeft = (this.x <= this.patrolBoundaryLeft);
        const hitRight = (this.x >= this.patrolBoundaryRight);
        const cooldownOver = (this.attackCooldown <= 0);

        if (hitLeft || hitRight || cooldownOver) {
            this.wakeUp();
        }
        return;
    }

    if (!this.isAttacking && !this.isBraking) {
        // Lógica de Patrulha
        const speedJitter = Phaser.Math.Between(-this.patrolSpeedJitter, this.patrolSpeedJitter);
        let targetVelocityX = (this.patrolDirection * this.baseSpeed) + speedJitter;

        if (this.x <= this.patrolBoundaryLeft) {
            this.patrolDirection = 1;
            this.setFlipX(false);
            this.nextPatrolTurnAt = time + Phaser.Math.Between(1200, 2400);
        } else if (this.x >= this.patrolBoundaryRight) {
            this.patrolDirection = -1;
            this.setFlipX(true);
            this.nextPatrolTurnAt = time + Phaser.Math.Between(1200, 2400);
        }

        if (time >= this.nextPatrolTurnAt && this.x > 0 && this.x < this.scene.scale.width) {
            this.patrolDirection *= -1;
            this.setFlipX(this.patrolDirection < 0);
            this.nextPatrolTurnAt = time + Phaser.Math.Between(1200, 2400);
        }

        targetVelocityX = (this.patrolDirection * this.baseSpeed) + Phaser.Math.Between(-30, 30);
        if (this.body) {
            const currentVelocityX = this.body.velocity.x;
            const lerpFactor = this.acceleration * delta;
            const newVelocityX = Phaser.Math.Linear(currentVelocityX, targetVelocityX, Math.min(lerpFactor, 1));
            this.body.setVelocityX(newVelocityX);
        }
        
        if (this.anims.currentAnim && this.anims.currentAnim.key !== 'orange_walk_anim') {
            this.play('orange_walk_anim');
        }

        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0 && onGround && bird && !bird.isDead) {
            this.performComplexAttack(bird);
        }
    } else if (this.isAttacking && this.hasJumped) {
        if (this.isSpecialJumping && this.body.velocity.y > 0) {
            this.body.setGravityY(4000); 
        }

        if (!onGround) {
            if (this.body.velocity.y < 0) {
                 this.play('orange_jump_anim', true);
            } else {
                 this.play('orange_rolling_anim', true);
            }
        }

        if (onGround && this.body.velocity.y >= 0) {
            if (this.isSpecialJumping) {
                this.dieOnLanding();
            } else {
                this.finishAttack();
            }
        }
    }
  }

  performComplexAttack(bird) {
    if (!this.active || this.isDead) return;
    this.isAttacking = true;
    this.hasJumped = false;
    this.jumpCount++;
    this.play('orange_roll_start_anim');

    const jumpDir = (bird.x > this.x) ? 1 : -1;
    
    this.scene.time.delayedCall(200, () => {
      if (!this.active || this.isDead || !this.body) return;
      this.hasJumped = true;
      
      let jumpPowerY = -1450;
      let jumpPowerX = jumpDir * 350; 
      
      if (this.jumpCount >= 16 && this.isUpgraded) {
        this.isSpecialJumping = true;
        jumpPowerY = -2200; 
        jumpPowerX = jumpDir * 450; 
      }

      this.setFlipX(jumpDir < 0);
      this.body.setVelocityY(jumpPowerY);
      this.body.setVelocityX(jumpPowerX); 
      this.play('orange_rolling_anim', true);
    });
  }

  finishAttack() {
    if (!this.active || this.isDead) return;
    this.isAttacking = false;
    this.hasJumped = false;
    this.isBraking = true;
    if (this.body) {
        this.body.setVelocityX(-200);
    }
    this.play('orange_recover_anim');
    
    this.once('animationcomplete', () => {
        if (!this.active || this.isDead) return;
        
        // Versão normal SEMPRE dorme após o ataque
        if (!this.isUpgraded || Math.random() < this.sleepChance) {
            this.startSleeping();
        } else {
            this.isBraking = false;
            this.play('orange_walk_anim');
            this.attackCooldown = Phaser.Math.Between(1500, 3000);
        }
    });
  }

  startSleeping() {
      if (!this.active || this.isDead) return;
      this.isSleeping = true;
      this.isBraking = false;
      this.play('orange_sleep_anim');
      // Cooldown de ataque reiniciado ao dormir
      this.attackCooldown = this.isUpgraded ? 1000 : 4000;
  }

  wakeUp() {
      if (!this.active || this.isDead || !this.isSleeping) return;
      this.isSleeping = false;
      this.play('orange_recover_anim');
      this.once('animationcomplete', () => {
          if (this.active && !this.isDead) {
              this.play('orange_walk_anim');
              if (this.attackCooldown <= 0) {
                  this.attackCooldown = Phaser.Math.Between(500, 1500);
              }
          }
      });
  }

  dieOnLanding() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.scene && typeof this.scene.playSfx === 'function') {
      this.scene.playSfx('orange_die', { volume: 0.75 });
    }
    this.isSpecialJumping = false;
    
    this.play('orange_death_anim');
    
    if (this.body) {
      this.body.setVelocityX(-200); 
      this.body.setVelocityY(0);
      this.body.checkCollision.none = true;
    }

    this.scene.time.delayedCall(3000, () => {
        if (this.active) this.destroy();
    });
  }

  die(awardXP = true) {
    if (this.isDead) return;
    this.isDead = true;
    if (this.scene && typeof this.scene.playSfx === 'function') {
      this.scene.playSfx('orange_die', { volume: 0.75 });
    }

    if (awardXP && this.scene.bird && !this.scene.bird.isDead) {
        this.scene.bird.gainExperience(this.xpValue, this.scoreValue);
    }

    this.play('orange_death_anim');
    if (this.body) {
      this.body.setVelocityY(-400);
      this.body.setVelocityX(100);
      this.body.setAngularVelocity(500);
      this.body.checkCollision.none = true;
    }
    this.scene.time.delayedCall(2000, () => {
        if (this.active) this.destroy();
    });
  }
}
