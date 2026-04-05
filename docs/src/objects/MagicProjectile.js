export default class MagicProjectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, targetX, targetY, isCharged = false) {
    // Agora o projétil em voo usa sempre o pellet básico
    super(scene, x, y, 'magic_pellet');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2); 
    this.setDepth(60);
    this.isCharged = isCharged;
    
    // Configurações do comportamento teleguiado
    this.homingRange = 200; // Distância para começar a perseguir
    this.speed = isCharged ? 450 : 300;
    this.turnSpeed = 0.05; // Quão rápido ele vira em direção ao alvo (0 a 1)

    if (this.body) {
      this.body.setAllowGravity(false);
      this.body.setSize(12, 12);
      this.body.setOffset(10, 10);
    }

    this.play('magic_pellet_anim');

    // Define a direção inicial
    const initialAngle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    this.setRotation(initialAngle);

    // Usa um pequeno delay para garantir que o corpo físico esteja pronto
    scene.time.delayedCall(1, () => {
        if (this.active && this.body) {
            scene.physics.velocityFromRotation(this.rotation, this.speed, this.body.velocity);
        }
    });

    this.particles = scene.add.particles(0, 0, 'fairy_flash', {
        speed: 10,
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.4, end: 0 },
        blendMode: 'ADD',
        lifespan: 300,
        frequency: 30
    });

    this.particles.startFollow(this);

    this.on('destroy', () => {
        if (this.particles) this.particles.destroy();
    });
  }

  static preload(scene) {
    scene.load.spritesheet('magic_pellet', 'assets/Magic_Pellet (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('magic_charged_pellet', 'assets/Magic_Charged_Pellet (32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('final_impact_fx', 'assets/Final_Impact_FX.png', { frameWidth: 291, frameHeight: 301 });
  }

  static createAnimations(scene) {
    if (!scene.anims.exists('magic_pellet_anim')) {
      scene.anims.create({
        key: 'magic_pellet_anim',
        frames: scene.anims.generateFrameNumbers('magic_pellet', { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
      });
    }
    if (!scene.anims.exists('magic_charged_pellet_anim')) {
      scene.anims.create({
        key: 'magic_charged_pellet_anim',
        frames: scene.anims.generateFrameNumbers('magic_charged_pellet', { start: 0, end: 3 }),
        frameRate: 12,
        repeat: -1
      });
    }
    if (!scene.anims.exists('giant_climax_impact')) {
      scene.anims.create({
        key: 'giant_climax_impact',
        frames: scene.anims.generateFrameNumbers('final_impact_fx', { start: 0, end: 29 }),
        frameRate: 30,
        repeat: 0
      });
    }
  }

  takeDamage() {
    this.explode();
  }

  explode() {
    if (!this.active || this.isExploding) return;
    this.isExploding = true;
    if (this.particles) this.particles.stop();

    if (this.body) {
        this.body.setVelocity(0);
        this.body.setEnable(false);
    }
    
    this.play('giant_climax_impact');
    const explosionScale = this.isCharged ? 1.2 : 0.7;
    this.setScale(explosionScale);
    this.setRotation(0);

    // MECÂNICA DE REAÇÃO EM CADEIA
    // Verifica outros mísseis próximos para explodirem também
    if (this.scene && this.scene.enemyProjectiles) {
        const explosionRadius = 150 * explosionScale; 
        this.scene.enemyProjectiles.getChildren().forEach(other => {
            if (other !== this && other.active && !other.isExploding) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
                if (dist < explosionRadius) {
                    // Pequeno atraso aleatório para a reação em cadeia parecer mais orgânica
                    this.scene.time.delayedCall(Phaser.Math.Between(50, 150), () => {
                        if (other.active) other.explode();
                    });
                }
            }
        });
    }
    
    this.once('animationcomplete', () => {
      this.destroy();
    });
  }

  update(time, delta) {
    if (!this.active || !this.body) return;

    if (this.x < -200 || this.x > this.scene.scale.width + 200 || this.y < -200 || this.y > this.scene.scale.height + 200) {
      this.destroy();
      return;
    }

    const bird = this.scene.bird;
    if (bird && !bird.isDead) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, bird.x, bird.y);
        
        if (dist < this.homingRange) {
            const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, bird.x, bird.y);
            const currentAngle = this.rotation;
            const rotationStep = this.turnSpeed * (delta / 16.6); 
            const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, rotationStep);
            
            this.setRotation(newAngle);
            this.scene.physics.velocityFromRotation(newAngle, this.speed, this.body.velocity);

            if (this.particles) {
                this.particles.setParticleAlpha({ start: 0.8, end: 0 });
            }
        }
    }
  }
}
