import Bird from '../objects/Bird.js';
import Mushroom from '../objects/Mushroom.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
    this.bgLayers = [];
    this.bird = null;
    this.mushrooms = null;
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.spawnTimer = 0;
  }

  preload() {
    Bird.preload(this);
    Mushroom.preload(this);
    
    // Assets do cenário
    this.load.image('ceu_sombrio', 'assets/ceu_sombrio.jpg');
    this.load.image('bg_cielo', 'assets/Layer_0009_2.png');
    this.load.image('bg_arvores_fundo', 'assets/Layer_0008_3.png');
    this.load.image('bg_luzes_fundo', 'assets/Layer_0007_Lights.png');
    this.load.image('bg_arvores_densas', 'assets/Layer_0006_4.png');
    this.load.image('bg_arvores_medias', 'assets/Layer_0005_5.png');
    this.load.image('bg_luzes_frente', 'assets/Layer_0004_Lights.png');
    this.load.image('bg_arvores_finas', 'assets/Layer_0003_6.png');
    this.load.image('bg_arbustos', 'assets/Layer_0002_7.png');
    this.load.image('bg_grama_fundo', 'assets/Layer_0001_8.png');
    this.load.image('bg_chao', 'assets/Layer_0000_9.png');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    Bird.createAnimations(this);
    Mushroom.createAnimations(this);

    // ADICIONA O CENÁRIO
    const addLayer = (key, speed, isLight = false) => {
      const texture = this.textures.get(key);
      const img = texture.getSourceImage();
      const imgHeight = (img && img.height) ? img.height : 512;
      const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
      const scale = h / imgHeight;
      sprite.setScale(scale);
      sprite.width = w / scale;
      if (isLight) {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
        sprite.setAlpha(0.4);
      }
      this.bgLayers.push({ sprite: sprite, speed: speed });
    };

    addLayer('ceu_sombrio', 0.02);
    addLayer('bg_cielo', 0.1);
    addLayer('bg_arvores_fundo', 0.2);
    addLayer('bg_luzes_fundo', 0.3, true);
    addLayer('bg_arvores_densas', 0.5);
    addLayer('bg_arvores_medias', 0.7);
    addLayer('bg_luzes_frente', 0.8, true);
    addLayer('bg_arvores_finas', 1.0);
    addLayer('bg_arbustos', 1.2);
    addLayer('bg_grama_fundo', 1.5);
    addLayer('bg_chao', 2.0);

    // CHÃO INVISÍVEL (Mais baixo para alinhar com a grama visual)
    const groundHeight = 50; 
    this.ground = this.add.rectangle(0, h - groundHeight, w, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    // PÁSSARO
    this.bird = new Bird(this, 100, h / 2);
    this.bird.setDepth(50);
    // Ajustar hitbox do pássaro para ser menor e mais centralizada
    if (this.bird.body) {
      this.bird.body.setSize(10, 10);
      this.bird.body.setOffset(3, 3);
    }

    this.mushrooms = this.physics.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // COLISÕES
    this.physics.add.collider(this.bird, this.ground, () => {
      if (!this.bird.isDead) this.bird.die();
    });

    this.physics.add.overlap(this.bird, this.mushrooms, (bird, mushroom) => {
      if (!bird.isDead) bird.die();
    });

    this.physics.add.collider(this.mushrooms, this.ground);

    // MENUS
    this.createStartMenu(w, h);
    this.createPauseMenu(w, h);
    this.createGameOverMenu(w, h);
  }

  createStartMenu(w, h) {
    this.startGroup = this.add.group();
    const titleText = this.add.text(w / 2, h / 2 - 100, 'TORI-TORI', {
      fontSize: '120px', fontFamily: 'KenneyRocket', fill: '#fff', stroke: '#000', strokeThickness: 10
    }).setOrigin(0.5).setDepth(100);
    const startBtn = this.add.text(w / 2, h / 2 + 50, 'PRESS START', {
      fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#2e3b4e', padding: { x: 30, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    this.startGroup.add(titleText);
    this.startGroup.add(startBtn);
    startBtn.on('pointerdown', () => {
      this.isGameStarted = true;
      this.startGroup.clear(true, true);
    });
  }

  createPauseMenu(w, h) {
    this.pauseGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0).setDepth(200);
    const pauseText = this.add.text(w / 2, h / 2 - 50, 'PAUSED', {
      fontSize: '80px', fontFamily: 'KenneyRocket', fill: '#fff'
    }).setOrigin(0.5).setDepth(201);
    const resumeBtn = this.add.text(w / 2, h / 2 + 50, 'RESUME', {
      fontSize: '40px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#4e2e2e', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(201);
    this.pauseGroup.add(overlay);
    this.pauseGroup.add(pauseText);
    this.pauseGroup.add(resumeBtn);
    this.pauseGroup.setVisible(false);
    resumeBtn.on('pointerdown', () => this.togglePause());
  }

  createGameOverMenu(w, h) {
    this.gameOverGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0).setDepth(300);
    const deadText = this.add.text(w / 2, h / 2 - 80, 'GAME OVER', {
      fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#f00', stroke: '#000', strokeThickness: 10
    }).setOrigin(0.5).setDepth(301);
    const restartBtn = this.add.text(w / 2, h / 2 + 60, 'RESTART', {
      fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#333', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(301);
    this.gameOverGroup.add(overlay);
    this.gameOverGroup.add(deadText);
    this.gameOverGroup.add(restartBtn);
    this.gameOverGroup.setVisible(false);
    restartBtn.on('pointerdown', () => {
      this.isGameOver = false;
      this.scene.restart();
    });
  }

  togglePause() {
    if (!this.isGameStarted || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.pauseGroup.setVisible(this.isPaused);
    if (this.isPaused) this.physics.pause();
    else this.physics.resume();
  }

  spawnMushroom() {
    const x = this.scale.width + 100;
    const y = this.scale.height - 120; // Surge levemente acima do chão
    const mushroom = new Mushroom(this, x, y);
    this.mushrooms.add(mushroom);
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
    if (this.isPaused) return;

    if (this.bird && this.bird.isDead) {
      if (this.bird.y > this.scale.height + 50) {
        this.isGameOver = true;
        this.gameOverGroup.setVisible(true);
      }
      return;
    }

    // Move o Parallax
    this.bgLayers.forEach(layer => {
      layer.sprite.tilePositionX += layer.speed;
    });

    if (this.isGameStarted) {
      this.bird.update(this.cursors);
      
      this.spawnTimer += delta;
      if (this.spawnTimer > 1500) {
        this.spawnMushroom();
        this.spawnTimer = 0;
      }
      
      this.mushrooms.getChildren().forEach(m => m.update());
    } else {
      this.bird.idleFloating(time);
    }
  }
}
