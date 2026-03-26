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
      this.body.setGravityY(1000); 
      this.body.setSize(25, 35);
      this.body.setOffset(27, 29);
      this.body.setVelocityX(-200); 
    }

    this.play('mushroom_run_anim');
    this.hp = 2;
    this.xpValue = 20;
    this.scoreValue = 100;
    this.isAttacking = false;
    this.isDead = false;
    this.isStunned = false;
    this.isBraking = false;
    this.isTired = false;
    
    // Configurações de Perseguição e Cansaço
    this.baseSpeed = 180;
    this.acceleration = 0.004; 
    this.nextFlipTime = 0;
    this.flipDelay = 600; 
    this.chaseTimer = 5000; // 5 segundos de fôlego
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
    scene.anims.create({ key: 'mushroom_idle_anim', frames: scene.anims.generateFrameNumbers('mushroom_idle', { start: 0, end: 6 }), frameRate: 10, repeat: -1 });
    scene.anims.create({ key: 'mushroom_run_anim', frames: scene.anims.generateFrameNumbers('mushroom_run', { start: 0, end: 7 }), frameRate: 12, repeat: -1 });
    scene.anims.create({ key: 'mushroom_attack_anim', frames: scene.anims.generateFrameNumbers('mushroom_attack', { start: 0, end: 9 }), frameRate: 15, repeat: 0 });
    scene.anims.create({ key: 'mushroom_die_anim', frames: scene.anims.generateFrameNumbers('mushroom_die', { start: 0, end: 14 }), frameRate: 15, repeat: 0 });
    scene.anims.create({ key: 'mushroom_hit_anim', frames: scene.anims.generateFrameNumbers('mushroom_hit', { start: 0, end: 4 }), frameRate: 15, repeat: 0 });
    scene.anims.create({ key: 'mushroom_stun_anim', frames: scene.anims.generateFrameNumbers('mushroom_stun', { start: 0, end: 17 }), frameRate: 12, repeat: -1 });
  }

  takeDamage() {
    if (!this.active || this.isDead) return;

    this.hp--;
    if (this.hp <= 0) this.die();
    else this.enterStun();
  }

  enterStun() {
    if (!this.active || this.isDead) return;
    this.isStunned = true;
    this.isAttacking = false;
    this.isBraking = false;
    this.body.setVelocityX(-200); 
    this.play('mushroom_hit_anim');
    this.once('animationcomplete-mushroom_hit_anim', () => {
      if (this.active && !this.isDead) {
        this.play('mushroom_stun_anim');
        this.scene.time.delayedCall(1500, () => {
          if (this.active && !this.isDead) {
            this.isStunned = false;
            this.play(this.isTired ? 'mushroom_idle_anim' : 'mushroom_run_anim');
          }
        });
      }
    });
  }

  update(bird, time, delta) {
    if (!this.active) return;

    if (this.x < -300 || this.x > this.scene.scale.width + 500) {
      this.destroy();
      return;
    }

    // Se estiver cansado, morto ou o jogo acabou, apenas desliza com o cenário
    if (this.isDead || this.isTired || (bird && bird.isDead) || this.scene.isGameOver) {
      if (this.body) this.body.setVelocityX(-200);
      if (this.anims && this.anims.currentAnim?.key !== 'mushroom_idle_anim' && !this.isDead) {
        this.play('mushroom_idle_anim');
      }
      return;
    }

    if (this.isStunned) {
      if (this.body) this.body.setVelocityX(-200);
      return;
    }

    const onGround = this.body && (this.body.blocked.down || this.body.touching.down);

    // Diminui o cronômetro de perseguição se estiver ativo
    if (!this.isAttacking && !this.isBraking) {
        this.chaseTimer -= delta;
        if (this.chaseTimer <= 0) {
            this.isTired = true;
            this.play('mushroom_idle_anim');
            return;
        }
    }

    // LÓGICA DE DIREÇÃO (FLIP)
    if (bird && !this.isAttacking && !this.isBraking && onGround) {
      const birdIsToRight = bird.x > this.x;
      if (this.flipX !== birdIsToRight && time > this.nextFlipTime) {
        this.setFlipX(birdIsToRight);
        this.nextFlipTime = time + this.flipDelay;
      }
    }

    if (this.isAttacking) {
      if (onGround && this.body.velocity.y >= 0) {
        this.isAttacking = false;
        this.isBraking = true;
        this.body.setVelocityX(-200);
        this.play('mushroom_idle_anim');
        this.scene.time.delayedCall(400, () => {
          if (this.active && !this.isDead && this.isBraking) {
            this.isBraking = false;
            this.play('mushroom_run_anim');
          }
        });
      }
      return; 
    }

    if (!this.isBraking && bird && !bird.isDead) {
      const diffX = bird.x - this.x;
      let targetVelocityX = -200;

      if (Math.abs(diffX) > 40) {
        const moveDirection = diffX > 0 ? 1 : -1;
        targetVelocityX = (moveDirection * this.baseSpeed) + (moveDirection > 0 ? -50 : -100);
      } else {
        targetVelocityX = -200;
      }

      if (this.body) {
        const currentVelocityX = this.body.velocity.x;
        const lerpFactor = this.acceleration * delta;
        const newVelocityX = Phaser.Math.Linear(currentVelocityX, targetVelocityX, Math.min(lerpFactor, 1));
        this.body.setVelocityX(newVelocityX);
      }

      const distance = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
      if (distance < 300 && onGround) {
        this.isAttacking = true;
        this.body.setVelocityY(-950); 
        const attackImpulse = (diffX > 0) ? 50 : -450;
        this.body.setVelocityX(attackImpulse);
        this.play('mushroom_attack_anim');
      }
    } else if (this.isBraking) {
      this.body.setVelocityX(-200);
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isAttacking = false;
    this.isStunned = false;
    if (this.anims) this.anims.stop();
    this.off('animationcomplete-mushroom_attack_anim');
    this.off('animationcomplete-mushroom_hit_anim');
    if (this.body) this.body.setVelocityX(-200); 
    this.play('mushroom_die_anim');
  }
}
