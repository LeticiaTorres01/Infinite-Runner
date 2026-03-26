import MagicProjectile from './MagicProjectile.js';

export default class Fairy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'fairy_idle');
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2.5);
    this.setDepth(55);
    this.setFlipX(true);
    this.setFlipY(false);

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setImmovable(true); 
      this.body.setVelocity(0, 0); 
      this.body.setSize(20, 20);
      this.body.setOffset(6, 6);
    }

    this.hp = 3;
    this.isDead = false;
    this.attackCooldown = 1500;
    this.fleeCooldown = 0; // Novo: Cooldown para não fugir o tempo todo
    this.state = 'IDLE'; 
    this.attackTimer = null;
    this.targetPos = { x: x, y: y }; // Novo: Destino para flutuar

    this.play('fairy_idle_anim');
  }

  static preload(scene) {
    MagicProjectile.preload(scene);
    // Invertido conforme instrução do usuário: Hurt (32 x 32).png é Idle, Idle_Flying (32 x 32).png é Hurt
    scene.load.spritesheet('fairy_idle', 'assets/Hurt (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('fairy_hurt', 'assets/Idle_Flying (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('fairy_move', 'assets/Flying_Forward_Movement (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('fairy_release', 'assets/Magic_Attack_Release (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('fairy_flash', 'assets/Magic_Flash_Burst.png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('fairy_blink', 'assets/Blink (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
  }

  static createAnimations(scene) {
    MagicProjectile.createAnimations(scene);
    
    if (!scene.anims.exists('fairy_idle_anim')) {
      scene.anims.create({
        key: 'fairy_idle_anim',
        frames: scene.anims.generateFrameNumbers('fairy_idle', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
    if (!scene.anims.exists('fairy_hurt_anim')) {
      scene.anims.create({
        key: 'fairy_hurt_anim',
        frames: scene.anims.generateFrameNumbers('fairy_hurt', { start: 0, end: 0 }),
        frameRate: 1,
        repeat: 0
      });
    }
    if (!scene.anims.exists('fairy_move_anim')) {
      scene.anims.create({
        key: 'fairy_move_anim',
        frames: scene.anims.generateFrameNumbers('fairy_move', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!scene.anims.exists('fairy_blink_anim')) {
      scene.anims.create({
        key: 'fairy_blink_anim',
        frames: scene.anims.generateFrameNumbers('fairy_blink', { start: 0, end: 4 }),
        frameRate: 10,
        repeat: 0
      });
    }
    if (!scene.anims.exists('fairy_teleport_burst')) {
      scene.anims.create({
        key: 'fairy_teleport_burst',
        frames: scene.anims.generateFrameNumbers('fairy_flash', { start: 0, end: 1 }),
        frameRate: 15,
        repeat: 0
      });
    }
    if (!scene.anims.exists('fairy_release_anim')) {
      scene.anims.create({
        key: 'fairy_release_anim',
        frames: scene.anims.generateFrameNumbers('fairy_release', { start: 0, end: 1 }),
        frameRate: 12,
        repeat: 0
      });
    }
  }

  update(bird, time, delta) {
    if (this.isDead || !this.active) return;

    if (bird && !bird.isDead) {
        this.setFlipX(bird.x < this.x);
    }

    // Efeito visual de invulnerabilidade (Ghost Mode)
    const isMovingAnim = this.anims.currentAnim && this.anims.currentAnim.key === 'fairy_move_anim';
    if (isMovingAnim || this.state === 'TELEPORTING') {
        this.setAlpha(0.6); 
    } else {
        this.setAlpha(1.0);
    }

    // Cooldown de fuga diminui com o tempo
    if (this.fleeCooldown > 0) this.fleeCooldown -= delta;

    if (bird && !bird.isDead && this.state === 'IDLE' && this.fleeCooldown <= 0) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
        // Distância reduzida para facilitar matar
        if (dist < 150) {
            this.flee(bird);
            return; 
        }
    }

    if (this.state === 'IDLE' || this.state === 'MOVING') {
      this.updateMovement(time, delta);
      
      if (this.state === 'IDLE') {
        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0 && bird && !bird.isDead) {
          this.performComplexAttack(bird);
        }
      }
    }
  }

  updateMovement(time, delta) {
    // Flutuação senoidal básica
    this.y += Math.sin(time / 400) * 0.5;

    // Lógica para escolher novo destino aleatório ocasionalmente
    const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.targetPos.x, this.targetPos.y);
    
    if (distToTarget < 15) {
        // Chegou no destino, espera um pouco e escolhe outro
        if (this.state === 'MOVING') {
            this.state = 'IDLE';
            this.play('fairy_idle_anim', true);
        }

        if (Math.random() < 0.01) {
            this.targetPos = {
                x: Phaser.Math.Between(100, this.scene.scale.width - 100),
                y: Phaser.Math.Between(100, this.scene.scale.height - 200)
            };
            this.state = 'MOVING';
        }
    } else {
        // Move em direção ao alvo mais rápido (4.0 em vez de 1.5)
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPos.x, this.targetPos.y);
        this.x += Math.cos(angle) * 4.0;
        this.y += Math.sin(angle) * 4.0;
        
        if (this.state !== 'MOVING') {
            this.state = 'MOVING';
            this.play('fairy_move_anim', true);
        }
    }
  }

  flee(bird) {
    this.state = 'TELEPORTING';
    this.fleeCooldown = 3000; // Só foge de novo daqui a 3 segundos
    this.scene.tweens.killTweensOf(this); 
    
    if (this.attackTimer) {
        this.attackTimer.remove();
        this.attackTimer = null;
    }

    this.executeTeleport(bird);
  }

  getSafeCorner(bird) {
    // Agora retorna um ponto aleatório longe do pássaro em vez de apenas cantos
    const margin = 100;
    let bestPos = { x: this.x, y: this.y };
    let maxDist = -1;

    for (let i = 0; i < 5; i++) {
        const testPos = {
            x: Phaser.Math.Between(margin, this.scene.scale.width - margin),
            y: Phaser.Math.Between(margin, this.scene.scale.height - margin)
        };
        const d = Phaser.Math.Distance.Between(testPos.x, testPos.y, bird.x, bird.y);
        if (d > maxDist) {
            maxDist = d;
            bestPos = testPos;
        }
    }

    return bestPos;
  }

  performComplexAttack(bird) {
    this.state = 'CHARGING';
    // A própria Fairy agora assume a animação da bolinha carregada
    this.play('magic_charged_pellet_anim'); 
    
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-2, 2),
      duration: 50,
      repeat: 20,
      yoyo: true
    });

    this.attackTimer = this.scene.time.delayedCall(1000, () => {
      if (!this.active || this.isDead) return;
      this.executeTeleport(bird, true);
    });
  }

  executeTeleport(bird, shouldShoot = false) {
    this.state = 'TELEPORTING';
    if (this.body) this.body.setEnable(false); 
    
    const flash = this.scene.add.sprite(this.x, this.y, 'fairy_flash').setScale(3).setDepth(this.depth + 1);
    flash.play('fairy_teleport_burst');
    flash.once('animationcomplete', () => flash.destroy());

    this.setAlpha(0); 
    const safePos = this.getSafeCorner(bird);

    this.scene.time.delayedCall(300, () => {
      if (!this.active || this.isDead) return;
      
      this.setPosition(safePos.x, safePos.y);
      if (this.body) {
          this.body.setEnable(true);
          this.body.setVelocity(0, 0); 
      }
      
      const flashEnd = this.scene.add.sprite(this.x, this.y, 'fairy_flash').setScale(3).setDepth(this.depth + 1);
      flashEnd.playReverse('fairy_teleport_burst');
      flashEnd.once('animationcomplete', () => flashEnd.destroy());
      
      this.setAlpha(1);

      if (shouldShoot) {
          this.state = 'ATTACKING';
          this.play('fairy_release_anim');
          
          this.once('animationcomplete', () => {
              if (!this.active || this.isDead) return;
              
              const proj = new MagicProjectile(this.scene, this.x, this.y, bird.x, bird.y, true);
              if (this.scene.events) this.scene.events.emit('fairyShoot', proj);

              this.state = 'RECOVERING';
              this.play('fairy_hurt_anim');
              
              this.scene.time.delayedCall(800, () => {
                  if (!this.active || this.isDead) return;
                  this.state = 'IDLE';
                  this.play('fairy_idle_anim');
                  this.attackCooldown = Phaser.Math.Between(800, 1800); // Frequência aumentada
              });
          });
      } else {
          this.state = 'IDLE';
          this.play('fairy_idle_anim');
          this.attackCooldown = 1000;
      }
    });
  }

  takeDamage() {
    const isMovingAnim = this.anims.currentAnim && this.anims.currentAnim.key === 'fairy_move_anim';
    if (this.isDead || !this.active || isMovingAnim || this.state === 'TELEPORTING') return; // Intargeteável ao voar ou teleportar
    this.hp--;
    this.play('fairy_hurt_anim');
    
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 2
    });

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.body) this.body.setEnable(false);
    
    if (this.attackTimer) {
        this.attackTimer.remove();
        this.attackTimer = null;
    }

    const deathFX = this.scene.add.sprite(this.x, this.y, 'final_impact_fx').setScale(1).setDepth(100);
    deathFX.play('giant_climax_impact');
    deathFX.once('animationcomplete', () => deathFX.destroy());

    this.scene.tweens.add({
      targets: this,
      y: this.y + 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => this.destroy()
    });
  }
}
