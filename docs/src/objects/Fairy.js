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

    this.hp = 1;
    this.isDead = false;
    this.attackCooldown = 2000;
    this.state = 'INTRO'; 
    this.attackTimer = null;
    this.isUpgraded = false;
    
    // Inicia a entrada cinemática (estilo Tori)
    this.startIntro();
  }

  upgrade() {
    this.isUpgraded = true;
    this.hp = 2; // Versão evoluída aguenta 2 cocôs
    
    // Aura Roxa Fininha (Padrão de evolução)
    this.glowFX = this.preFX.addGlow(0x9900ff, 1, 0, false, 0.1, 10);
    this.scene.tweens.add({
        targets: this.glowFX,
        outerStrength: 3,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  static preload(scene) {
    MagicProjectile.preload(scene);
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
    if (!scene.anims.exists('fairy_release_anim')) {
      scene.anims.create({
        key: 'fairy_release_anim',
        frames: scene.anims.generateFrameNumbers('fairy_release', { start: 0, end: 1 }),
        frameRate: 12,
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
  }

  startIntro() {
    this.play('fairy_move_anim');
    this.scene.tweens.add({
      targets: this,
      x: this.scene.scale.width - 400,
      duration: 2500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        if (this.active && !this.isDead) {
          this.fleeToCorner();
        }
      }
    });
  }

  fleeToCorner() {
    if (this.isDead || !this.active) return;
    
    this.state = 'FLEEING';
    if (this.body) this.body.setEnable(false);
    
    // Efeito de Teletransporte (Saída)
    const flash = this.scene.add.sprite(this.x, this.y, 'fairy_flash').setScale(3).setDepth(this.depth + 1);
    flash.play('fairy_teleport_burst');
    flash.once('animationcomplete', () => flash.destroy());

    this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 300,
        onComplete: () => {
            if (!this.active || this.isDead) return;
            
            // Escolhe um canto longe do passaro
            const bird = this.scene.bird;
            const targetPos = this.getBestCorner(bird);
            
            this.setPosition(targetPos.x, targetPos.y);
            
            // Efeito de Teletransporte (Entrada)
            const flashIn = this.scene.add.sprite(this.x, this.y, 'fairy_flash').setScale(3).setDepth(this.depth + 1);
            flashIn.playReverse('fairy_teleport_burst');
            flashIn.once('animationcomplete', () => flashIn.destroy());

            this.scene.tweens.add({
                targets: this,
                alpha: 1,
                duration: 300,
                onComplete: () => {
                    if (!this.active || this.isDead) return;
                    if (this.body) this.body.setEnable(true);
                    this.state = 'SNIPING';
                    this.play('fairy_idle_anim');
                    this.attackCooldown = this.isUpgraded ? 800 : 1500; 
                }
            });
        }
    });
  }

  getBestCorner(bird) {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const margin = 150;
    
    const corners = [
        { x: margin, y: margin }, // Top Left
        { x: w - margin, y: margin }, // Top Right
        { x: margin, y: h - margin - 100 }, // Bottom Left
        { x: w - margin, y: h - margin - 100 } // Bottom Right
    ];

    if (!bird) return corners[Phaser.Math.Between(0, corners.length - 1)];

    // Filtra cantos para pegar o mais distante do passarinho
    let bestDist = -1;
    let bestPos = corners[0];

    corners.forEach(pos => {
        const d = Phaser.Math.Distance.Between(pos.x, pos.y, bird.x, bird.y);
        if (d > bestDist) {
            bestDist = d;
            bestPos = pos;
        }
    });

    return bestPos;
  }

  update(bird, time, delta) {
    if (this.isDead || !this.active) return;

    if (this.state === 'INTRO') return;

    if (bird && !bird.isDead) {
        this.setFlipX(bird.x < this.x);

        // Se o passarinho chegar perto (menos de 300 pixels), ela foge
        const dist = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
        if (dist < 300 && this.state === 'SNIPING') {
            this.fleeToCorner();
            return;
        }
    }

    if (this.state === 'SNIPING') {
        // Flutuação senoidal leve
        this.y += Math.sin(time / 400) * 0.5;

        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0 && bird && !bird.isDead) {
            this.shoot(bird);
        }
    }
  }

  shoot(bird) {
    this.state = 'ATTACKING';
    this.play('magic_charged_pellet_anim'); // Carregando...
    
    this.scene.tweens.add({
        targets: this,
        x: this.x + Phaser.Math.Between(-3, 3),
        duration: 50,
        repeat: 10,
        yoyo: true
    });

    this.attackTimer = this.scene.time.delayedCall(800, () => {
        if (!this.active || this.isDead) return;
        
        this.play('fairy_release_anim');
        
        if (this.isUpgraded) {
            // Rajada de 3 tiros em leque
            const angles = [-0.15, 0, 0.15]; // Pequena variação de ângulo
            angles.forEach(offset => {
                const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, bird.x, bird.y) + offset;
                const tx = this.x + Math.cos(targetAngle) * 1000;
                const ty = this.y + Math.sin(targetAngle) * 1000;
                const proj = new MagicProjectile(this.scene, this.x, this.y, tx, ty, true);
                if (this.scene.events) this.scene.events.emit('fairyShoot', proj);
            });
        } else {
            // Tiro único normal
            const proj = new MagicProjectile(this.scene, this.x, this.y, bird.x, bird.y, true);
            if (this.scene.events) this.scene.events.emit('fairyShoot', proj);
        }

        this.once('animationcomplete', () => {
            if (!this.active || this.isDead) return;
            this.state = 'SNIPING';
            this.play('fairy_idle_anim');
            this.attackCooldown = this.isUpgraded ? Phaser.Math.Between(600, 1200) : Phaser.Math.Between(1500, 2500);
        });
    });
  }

  takeDamage() {
    if (this.isDead || !this.active || this.state === 'FLEEING') return;
    
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
    } else {
        // Fugir após levar dano
        this.fleeToCorner();
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
