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
    this.xpValue = 20;    // Adicionado
    this.scoreValue = 100; // Adicionado
    this.isAttacking = false;
    this.isDead = false;
    this.isStunned = false;
    
    this.nextFlipTime = 0;
    this.flipDelay = 600; 
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
    if (this.isDead) return;

    this.hp--;
    if (this.hp <= 0) this.die();
    else this.enterStun();
  }

  enterStun() {
    this.isStunned = true;
    this.isAttacking = false;
    this.setVelocityX(-200); 
    this.play('mushroom_hit_anim');
    this.once('animationcomplete-mushroom_hit_anim', () => {
      if (!this.isDead) {
        this.play('mushroom_stun_anim');
        this.scene.time.delayedCall(1500, () => {
          if (!this.isDead) {
            this.isStunned = false;
            this.play('mushroom_run_anim');
          }
        });
      }
    });
  }

  update(bird) {
    const currentTime = this.scene.time.now;

    // 1. Destruição se sair da tela
    if (this.x < -300 || this.x > this.scene.scale.width + 500) {
      this.destroy();
      return;
    }

    // 2. Se o pássaro morreu ou o jogo acabou, para e entra em IDLE
    if ((bird && bird.isDead) || this.scene.isGameOver) {
      this.setVelocityX(0);
      if (this.anims.currentAnim?.key !== 'mushroom_idle_anim' && !this.isDead) {
        this.play('mushroom_idle_anim');
      }
      return;
    }

    // 3. Se estiver morto (própria morte) ou atordoado, apenas desliza com o cenário
    if (this.isDead || this.isStunned) {
      if (this.body) this.setVelocityX(-200);
      return;
    }

    // 4. LÓGICA DE DIREÇÃO (FLIP) - Só vira no chão e quando não estiver atacando
    if (bird && !this.isAttacking && this.body && this.body.blocked.down) {
      const birdIsToRight = bird.x > this.x;
      if (this.flipX !== birdIsToRight && currentTime > this.nextFlipTime) {
        this.setFlipX(birdIsToRight);
        this.nextFlipTime = currentTime + this.flipDelay;
      }
    }

    // 5. Se estiver no ar atacando, mantém a trajetória e Pose
    if (this.isAttacking) {
      if (this.body && this.body.blocked.down) {
        this.isAttacking = false;
        this.play('mushroom_run_anim');
      }
      return; 
    }

    // 6. IA DE PERSEGUIÇÃO
    if (bird && !bird.isDead) {
      const diffX = bird.x - this.x;
      let targetVelocityX = -200;

      if (diffX > 100) {
        targetVelocityX = -50; 
      } else if (diffX < -100) {
        targetVelocityX = -250; // não alterar essa velocidade, pois o cenário já move o cogumelo para a esquerda em -200, então isso faz ele ir mais rápido para perseguir o pássaro
      } else {
        targetVelocityX = -200;
      }

      this.setVelocityX(targetVelocityX);

      // Pulo de Ataque
      const distance = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
      if (distance < 300 && this.body && this.body.blocked.down) {
        this.isAttacking = true;
        this.setVelocityY(-850); 
        const attackImpulse = (diffX > 0) ? 50 : -450;
        this.setVelocityX(attackImpulse);
        this.play('mushroom_attack_anim');
      }
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isAttacking = false;
    this.isStunned = false;
    this.anims.stop();
    this.off('animationcomplete-mushroom_attack_anim');
    this.off('animationcomplete-mushroom_hit_anim');
    if (this.body) this.setVelocityX(-200); 
    this.play('mushroom_die_anim');
  }
}
