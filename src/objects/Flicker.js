export default class Flicker extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Começamos com a animação idle
    super(scene, x, y, 'flicker_idle');
    
    this.setScale(1.5); 
    this.setOrigin(0.5, 0.5); 
    this.setDepth(15); // Entre as árvores e o pássaro

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body) {
      this.body.setAllowGravity(false); // Estático no ar/árvore
      this.body.setSize(20, 20);
      this.body.setOffset(6, 6);
      // Velocidade para acompanhar o cenário (ajustável no PlayScene)
      this.body.setVelocityX(-200); 
    }

    this.play('flicker_idle_anim');
    this.hp = 1;
    this.xpValue = 5;
    this.scoreValue = 50;
    this.isDead = false;
  }

  static preload(scene) {
    // Carregando as spritesheets de 32x32
    // Nota: Como não sei o número exato de frames, usarei uma estimativa comum ou deixarei flexível
    scene.load.spritesheet('flicker_idle', 'assets/Idle_Flicker_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('flicker_weak', 'assets/Weak_Flicker_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('flicker_death', 'assets/Death_(32 x 32).png', { frameWidth: 32, frameHeight: 32 });
  }

  static createAnimations(scene) {
    // Criando animações baseadas nos arquivos
    if (!scene.anims.exists('flicker_idle_anim')) {
      scene.anims.create({
        key: 'flicker_idle_anim',
        frames: scene.anims.generateFrameNumbers('flicker_idle', { start: 0, end: 3 }), // Assumindo 4 frames
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('flicker_weak_anim')) {
      scene.anims.create({
        key: 'flicker_weak_anim',
        frames: scene.anims.generateFrameNumbers('flicker_weak', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    if (!scene.anims.exists('flicker_death_anim')) {
      scene.anims.create({
        key: 'flicker_death_anim',
        frames: scene.anims.generateFrameNumbers('flicker_death', { start: 0, end: 5 }), // Assumindo 6 frames
        frameRate: 12,
        repeat: 0
      });
    }
  }

  takeDamage() {
    if (this.isDead) return;
    this.hp--;
    if (this.hp <= 0) {
      this.die();
    } else {
      this.play('flicker_weak_anim');
    }
  }

  update() {
    // Destruição se sair da tela pela esquerda
    if (this.x < -100) {
      this.destroy();
      return;
    }

    // Se o jogo pausar ou acabar, para o movimento
    if (this.scene.isPaused || this.scene.isGameOver) {
      if (this.body) this.body.setVelocityX(0);
      return;
    } else {
      if (this.body && !this.isDead) this.body.setVelocityX(-200);
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    if (this.body) {
      this.body.setVelocityX(-200); // Continua movendo com o cenário enquanto morre
      this.body.enable = false; // Desativa colisões
    }
    this.play('flicker_death_anim');
    this.once('animationcomplete-flicker_death_anim', () => {
      this.destroy();
    });
  }
}
