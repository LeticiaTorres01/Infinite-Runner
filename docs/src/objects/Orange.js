export default class Orange extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'orange_idle');
    
    this.setScale(2); 
    this.setOrigin(0.5, 1); 
    this.setDepth(12);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body) {
      this.body.setAllowGravity(true);
      this.body.setGravityY(1000); 
      this.body.setSize(20, 24);
      this.body.setOffset(6, 8);
    }

    this.hp = 2;
    this.xpValue = 25;
    this.scoreValue = 150;
    this.isDead = false;
    this.isAttacking = false; 
    this.isSleeping = false;
    this.isBraking = false;
    this.hasJumped = false;
    
    // Configurações de Perseguição
    this.baseSpeed = 230;
    this.acceleration = 0.005; 
    this.nextFlipTime = 0;
    this.flipDelay = 500; 
    this.chaseSpeedMultiplier = 1.2;

    this.attackCooldown = Phaser.Math.Between(1000, 3000);
    this.sleepChance = 0.3; 
    
    this.play('orange_walk_anim');
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
      { key: 'orange_brake', path: 'assets/Orange_Recover.png' }, // Corrigido asset de brake se necessário, mas mantendo lógica
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
      { key: 'orange_brake_anim', texture: 'orange_brake', end: 2, rate: 10, repeat: 0 },
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
      this.isAttacking = false;
      this.isSleeping = false;
      this.isBraking = false;
      this.hasJumped = false;
      this.play('orange_hit_anim');
      this.once('animationcomplete', () => {
        if (this.active && !this.isDead) {
          this.play('orange_recover_anim');
          this.once('animationcomplete', () => {
             if (this.active && !this.isDead) this.play('orange_walk_anim');
          });
        }
      });
    }
  }

  update(bird, time, delta) {
    if (!this.active || this.isDead) return;

    if (this.x < -300 || this.x > this.scene.scale.width + 500) {
      this.destroy();
      return;
    }

    if (this.scene.isPaused || this.scene.isGameOver) {
      if (this.body) this.body.setVelocityX(-200); // Mantém movimento com o cenário no game over
      return;
    }

    const onGround = this.body && (this.body.blocked.down || this.body.touching.down);

    if (this.isSleeping) {
        this.body.setVelocityX(-200);
        return;
    }

    if (!this.isAttacking && !this.isBraking) {
        let targetVelocityX = -200; 
        
        if (bird && !bird.isDead) {
            const diffX = bird.x - this.x;
            const absDiffX = Math.abs(diffX);
            
            if (absDiffX > 40) {
                const moveDirection = diffX > 0 ? 1 : -1;
                targetVelocityX = moveDirection * this.baseSpeed * (moveDirection > 0 ? 0.8 : 1.2);
            } else {
                targetVelocityX = -200;
            }

            if (absDiffX > 20) {
                const birdIsToRight = diffX > 0;
                if (this.flipX !== !birdIsToRight) {
                    this.setFlipX(!birdIsToRight);
                }
            }
        }

        if (this.body) {
            const currentVelocityX = this.body.velocity.x;
            const lerpFactor = this.acceleration * delta;
            const newVelocityX = Phaser.Math.Linear(currentVelocityX, targetVelocityX, Math.min(lerpFactor, 1));
            this.body.setVelocityX(newVelocityX);
        }

        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0 && onGround && bird && !bird.isDead) {
            this.performComplexAttack(bird);
        }
    } else if (this.isAttacking && this.hasJumped) {
        if (!onGround) {
            if (this.body.velocity.y < 0) {
                 this.play('orange_jump_anim', true);
            } else {
                 this.play('orange_rolling_anim', true);
            }
        }

        if (onGround && this.body.velocity.y >= 0) {
            this.finishAttack();
        }
    }
  }

  performComplexAttack(bird) {
    if (!this.active || this.isDead) return;
    this.isAttacking = true;
    this.hasJumped = false;
    this.play('orange_roll_start_anim');
    
    this.scene.time.delayedCall(200, () => {
      if (!this.active || this.isDead || !this.body) return;
      this.hasJumped = true;
      
      const jumpPowerY = -700;
      let jumpPowerX = -450;
      
      if (bird) {
          const diffX = bird.x - this.x;
          jumpPowerX = diffX > 0 ? 300 : -600;
          this.setFlipX(diffX < 0);
      }
      
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
    this.body.setVelocityX(-200);
    this.play('orange_brake_anim');
    
    this.once('animationcomplete', () => {
        if (!this.active || this.isDead) return;
        
        if (Math.random() < this.sleepChance) {
            this.startSleeping();
        } else {
            this.play('orange_recover_anim');
            this.once('animationcomplete', () => {
                if (this.active && !this.isDead) {
                    this.isBraking = false;
                    this.play('orange_walk_anim');
                    this.attackCooldown = Phaser.Math.Between(1500, 3500);
                }
            });
        }
    });
  }

  startSleeping() {
      if (!this.active || this.isDead) return;
      this.isSleeping = true;
      this.isBraking = false;
      this.play('orange_sleep_anim');
      
      this.scene.time.delayedCall(1000, () => {
          if (!this.active || this.isDead) return;
          this.play('orange_recover_anim');
          this.once('animationcomplete', () => {
              if (this.active && !this.isDead) {
                  this.isSleeping = false;
                  this.play('orange_walk_anim');
                  this.attackCooldown = Phaser.Math.Between(1500, 3500);
              }
          });
      });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
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
