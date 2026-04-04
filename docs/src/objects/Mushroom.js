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

    this.hp = 10;
    this.xpValue = 40;
    this.scoreValue = 100;
    this.isDead = false;
    
    // Estados: 'WALKING', 'JUMPING', 'STUNNED'
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

    // Persistência: Quantas vezes ele vai "bater" nas bordas antes de sair definitivamente
    this.maxBounces = 2; 
    this.bounceCount = 0;

    this.play('mushroom_run_anim');

    this.isUpgraded = false;
    this.hasDoubleJumped = false; // Controle do pulo duplo
  }

  upgrade() {
    this.isUpgraded = true;
    this.hp = 20; // Mais vida
    this.stunDuration = 500; // Tempo de stun reduzido pela metade
    
    // Aura Laranja/Dourada intensa
    this.glowFX = this.preFX.addGlow(0xff8800, 4, 1, false, 0.1, 10);
    
    // Tween de pulsação de energia constante
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 10,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
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
        this.currentState = 'STUNNED';
        this.stunTimer = this.stunDuration;
        this.body.setVelocityX(0);
        this.play('mushroom_stun_anim');
    }
  }

  update(bird, time, delta) {
    if (!this.active) return;
    
    // Se estiver morto, ele só obedece à física. Destrói apenas quando sair muito da tela.
    if (this.isDead) {
        if (this.x < -300 || this.x > this.scene.scale.width + 300 || this.y > this.scene.scale.height + 200) {
            this.destroy();
        }
        return;
    }

    const onGround = this.body && (this.body.blocked.down || this.body.touching.down);
    const screenWidth = this.scene.scale.width;

    // Lógica de mudança de direção ao atingir bordas da tela
    if (this.bounceCount < this.maxBounces) {
        if (this.x < 100 && this.direction === -1) {
            this.direction = 1;
            this.bounceCount++;
            this.setFlipX(true);
        } else if (this.x > screenWidth - 100 && this.direction === 1) {
            this.direction = -1;
            this.bounceCount++;
            this.setFlipX(false);
        }
    }

    switch (this.currentState) {
        case 'STUNNED':
            this.stunTimer -= delta;
            if (this.stunTimer <= 0) {
                this.currentState = 'WALKING';
                this.walkTimer = this.walkDuration;
                this.play('mushroom_run_anim');
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
                this.hasDoubleJumped = false; // Reseta o pulo duplo
                this.body.setVelocityY(this.jumpPowerY);
                this.body.setVelocityX(this.jumpPowerX * this.direction);
                this.play('mushroom_attack_anim');
            }
            break;

        case 'JUMPING':
            // Mantém movimento horizontal no ar
            this.body.setVelocityX(this.jumpPowerX * this.direction);

            if (onGround && this.body.velocity.y >= 0) {
                if (this.isUpgraded && !this.hasDoubleJumped) {
                    // Executa o Pulo Duplo imediatamente e mais alto
                    this.hasDoubleJumped = true;
                    this.body.setVelocityY(this.jumpPowerY * 1.3); 
                    this.play('mushroom_attack_anim');
                } else {
                    // Pouso final, volta a andar
                    this.currentState = 'WALKING';
                    this.walkTimer = this.walkDuration;
                    this.body.setVelocityX(this.walkSpeed * this.direction);
                    this.play('mushroom_run_anim');
                }
            }
            break;
    }

    if (this.x < -1000 || this.x > screenWidth + 1000) {
      this.destroy();
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    // FIX: Entrega a XP e o Score para o Pássaro
    if (this.scene.bird && !this.scene.bird.isDead) {
        this.scene.bird.gainExperience(this.xpValue, this.scoreValue);
    }

    if (this.anims) this.anims.stop();
    if (this.body) {
        // FIX: Afetado pela gravidade e arrastado pelo cenário
        this.body.setAllowGravity(true);
        this.body.setVelocityX(-200); // Movimento da floresta
        // Mantemos a colisão ativada para ele quicar/bater no chão e não varar o mapa
    }
    this.play('mushroom_die_anim');
    
    // Removido o this.once('animationcomplete'...) para ele não sumir antes de sair da tela
  }
}
