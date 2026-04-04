export default class Bee extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bee_fly');
    
    this.setScale(2.5); 
    this.setDepth(15);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setSize(20, 20); 
      this.body.setOffset(6, 6);
    }

    this.play('bee_fly_anim');
    
    this.hp = 4;
    this.xpValue = 15;
    this.scoreValue = 100;
    this.directionX = -1; 
    this.baseSpeed = 150; 
    this.circleSpeed = 0.005; 
    this.timer = Phaser.Math.Between(0, 5000); 

    this.isDashing = false;
    this.isDead = false;
    this.nextAttackTime = scene.time.now + 1000; 

    this.attackCount = 0; // Conta quantas investidas a abelha já deu
    this.isSuicideDash = false; // Flag para a investida que sai da tela
    this.isUpgraded = false; // Flag para o monstro do round 7+
    this.comboCount = 0; // Conta os rasantes da abelha evoluída
  }

  upgrade() {
    this.isUpgraded = true;
    
    // Adiciona uma Aura Vermelha
    this.glowFX = this.preFX.addGlow(0xff0000, 2, 0, false, 0.1, 10);
    
    // Tween para fazer a aura piscar rápido (frenesi)
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 8,
        duration: 150, // Pisca bem rápido
        yoyo: true,
        repeat: -1
    });
  }

  static preload(scene) {
    scene.load.spritesheet('bee_fly', 'assets/Flying_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('bee_hurt', 'assets/Hurt_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('bee_attack', 'assets/Sting_Attack_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('bee_fly_anim')) {
      scene.anims.create({
        key: 'bee_fly_anim',
        frames: scene.anims.generateFrameNumbers('bee_fly', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!scene.anims.exists('bee_attack_anim')) {
      scene.anims.create({
        key: 'bee_attack_anim',
        frames: [{ key: 'bee_attack', frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
  }

  takeDamage(amount = 1) {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
    }
  }

  performAttack(bird) {
    if (!bird || bird.isDead || this.isDashing || this.isDead || this.scene.isGameOver) return;

    this.isDashing = true;
    this.play('bee_attack_anim');

    // Se já atacou 7 vezes, a 8ª investida é suicida (foge da tela)
    if (this.attackCount >= 9) {
        this.isSuicideDash = true;
    }

    const dx = (bird.x > this.x) ? 1 : -1;
    const dy = (bird.y > this.y) ? 1 : -1;

    // Na investida suicida, ela vai mais rápido
    const dashSpeed = this.isSuicideDash ? 600 : 400;
    this.setVelocity(dx * dashSpeed, dy * dashSpeed);

    // Se for o dash suicida, apenas retorna. O isDashing continuará true
    // e ela voará em linha reta até o método update() destruí-la fora da tela.
    if (this.isSuicideDash) {
        return;
    }

    this.attackCount++;

    // Tempo de duração do dash: se for upgraded, o rasante é mais curto para permitir o combo
    const dashDuration = this.isUpgraded ? 450 : 800;

    this.scene.time.delayedCall(dashDuration, () => {
      if (this.active && !this.isDead) {
        this.isDashing = false;
        this.play('bee_fly_anim');
        this.directionX = dx;

        // Lógica de tempo para o próximo ataque
        if (this.isUpgraded) {
            this.comboCount++;
            if (this.comboCount >= 3) {
                // Terminou o combo de 3 rasantes, pausa longa
                this.comboCount = 0;
                this.nextAttackTime = this.scene.time.now + 2000;
            } else {
                // Prepara imediatamente o próximo rasante do combo (pausa curta)
                this.nextAttackTime = this.scene.time.now + 500; 
            }
        } else {
            // Abelha normal: pausa longa padrão
            this.nextAttackTime = this.scene.time.now + 2000;
        }
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isDashing = false;

    if (this.scene.bird && !this.scene.bird.isDead) {
      this.scene.bird.gainExperience(this.xpValue, this.scoreValue);
    }

    this.anims.stop();
    this.setTexture('bee_hurt'); 
    
    if (this.body) {
      this.body.setAllowGravity(true); 
      this.body.setGravityY(1000);
      this.body.setVelocityX(-100); 
      this.body.checkCollision.none = true; 
    }

    this.setAngle(180);
  }

  update(bird) {
    if (this.x < -300 || this.x > this.scene.scale.width + 500 || this.y > this.scene.scale.height + 100) {
      this.destroy();
      return;
    }

    if (this.isDead) return;

    if (this.scene.isGameOver) {
        this.setVelocity(0);
        return;
    }

    if (this.isDashing) return;

    if (this.scene.time.now > this.nextAttackTime) {
      this.performAttack(bird);
      return;
    }

    if (this.x < 50) this.directionX = 1;
    else if (this.x > this.scene.scale.width - 50) this.directionX = -1;

    this.timer += 16;
    const vx = (this.baseSpeed * this.directionX) + Math.cos(this.timer * this.circleSpeed) * 100;
    const vy = Math.sin(this.timer * this.circleSpeed) * 100;
    this.setVelocity(vx, vy);

    if (bird && !bird.isDead) {
      this.setFlipX(this.x < bird.x); 
    }
  }
}
