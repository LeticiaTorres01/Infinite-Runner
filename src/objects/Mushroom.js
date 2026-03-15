export default class Mushroom extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'mushroom_run');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(2); // Ajuste de escala para pixel art
    this.setOrigin(0.5, 1); // Origem na base
    this.setDepth(10); // Garante que ele apareça na frente das camadas de fundo

    this.body.setAllowGravity(true);
    this.body.setImmovable(false);
    this.body.setGravityY(1000); // Força ele a ficar no chão
    
    // Configura a colisão com o mundo (chão)
    this.setCollideWorldBounds(false); // Desativar para ele poder entrar/sair da tela suavemente

    this.play('mushroom_run_anim');
    this.speed = -200; // Um pouco mais rápido
    this.setVelocityX(this.speed);
  }

  static preload(scene) {
    scene.load.spritesheet('mushroom_idle', 'assets/Mushroom-Idle.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_run', 'assets/Mushroom-Run.png', { frameWidth: 80, frameHeight: 64 });
    scene.load.spritesheet('mushroom_die', 'assets/Mushroom-Die.png', { frameWidth: 80, frameHeight: 64 });
  }

  static createAnimations(scene) {
    scene.anims.create({
      key: 'mushroom_idle_anim',
      frames: scene.anims.generateFrameNumbers('mushroom_idle', { start: 0, end: 6 }),
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: 'mushroom_run_anim',
      frames: scene.anims.generateFrameNumbers('mushroom_run', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1
    });
    scene.anims.create({
      key: 'mushroom_die_anim',
      frames: scene.anims.generateFrameNumbers('mushroom_die', { start: 0, end: 14 }),
      frameRate: 10,
      repeat: 0
    });
  }

  update() {
    // Se sair da tela pela esquerda, pode ser destruído para poupar memória
    if (this.x < -100) {
      this.destroy();
    }
  }
}
