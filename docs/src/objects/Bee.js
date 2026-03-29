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
    
    this.directionX = -1; 
    this.baseSpeed = 150; 
    this.circleSpeed = 0.005; 
    this.timer = Phaser.Math.Between(0, 5000); 

    this.isDashing = false;
    this.isDead = false;
    this.nextAttackTime = scene.time.now + 1000; 
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

  performAttack(bird) {
    if (!bird || bird.isDead || this.isDashing || this.isDead || this.scene.isGameOver) return;

    this.isDashing = true;
    this.play('bee_attack_anim');

    const dx = (bird.x > this.x) ? 1 : -1;
    const dy = (bird.y > this.y) ? 1 : -1;

    const dashSpeed = 400;
    this.setVelocity(dx * dashSpeed, dy * dashSpeed);

    this.scene.time.delayedCall(800, () => {
      if (this.active && !this.isDead) {
        this.isDashing = false;
        this.play('bee_fly_anim');
        this.directionX = dx;
        this.nextAttackTime = this.scene.time.now + 2000;
      }
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.isDashing = false;

    this.anims.stop();
    this.setTexture('bee_hurt'); // Usa o sprite de Hurt
    
    if (this.body) {
      this.body.setAllowGravity(true); // Cai
      this.body.setGravityY(1000);
      this.body.setVelocityX(-100); // Desliza com o cenário
      this.body.checkCollision.none = true; // Atravessa tudo ao cair
    }

    // Rotaciona para parecer que está caindo
    this.setAngle(180);
  }

  update(bird) {
    // 1. Destruição se sair da tela (incluindo cair pelo fundo)
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
