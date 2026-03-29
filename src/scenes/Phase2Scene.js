import Bird from '../objects/Bird.js';
import Mushroom from '../objects/Mushroom.js';
import Bee from '../objects/Bee.js';
import Poop from '../objects/Poop.js';
import Flicker from '../objects/Flicker.js';
import Orange from '../objects/Orange.js';
import Fairy from '../objects/Fairy.js';
import MagicProjectile from '../objects/MagicProjectile.js';
import SwordBoss from '../objects/SwordBoss.js';

export default class Phase2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Phase2Scene' });
    this.bgLayers = [];
    this.bird = null;
    this.boss = null;
    this.mushrooms = null;
    this.bees = null;
    this.poops = null;
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isBossSpawned = false;
    this.bgSpeedFactor = 1.0;
    this.spawnTimer = 0;
    this.hearts = [];
  }

  preload() {
    Bird.preload(this);
    Mushroom.preload(this);
    Bee.preload(this);
    Flicker.preload(this);
    Orange.preload(this);
    Fairy.preload(this);
    SwordBoss.preload(this);
    this.load.image('hearth', 'assets/hearth.png');
    this.load.image('poop_icon', 'assets/item1193.png');
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
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isBossSpawned = false;
    this.bgSpeedFactor = 1.0;
    this.spawnTimer = 0;
    this.bgLayers = [];
    this.hearts = [];

    const w = this.scale.width;
    const h = this.scale.height;

    Bird.createAnimations(this);
    Mushroom.createAnimations(this);
    Bee.createAnimations(this);
    Flicker.createAnimations(this);
    Orange.createAnimations(this);
    Fairy.createAnimations(this);
    SwordBoss.createAnimations(this);

    const addLayer = (key, speed, isLight = false) => {
      const texture = this.textures.get(key);
      const img = texture.getSourceImage();
      const imgHeight = (img && img.height) ? img.height : 512;
      const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
      const scale = h / imgHeight;
      sprite.setScale(scale).setTint(0x7755aa); 
      sprite.width = w / scale;
      if (isLight) {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
        sprite.setAlpha(0.3);
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

    const groundHeight = 50; 
    this.ground = this.add.rectangle(-2000, h - groundHeight, w + 4000, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    this.bird = new Bird(this, 100, h / 2);
    this.bird.setDepth(50);

    this.mushrooms = this.add.group();
    this.bees = this.add.group();
    this.poops = this.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.createHeartsHUD();
    this.createAmmoHUD();

    this.physics.add.collider(this.bird, this.ground, () => {
      if (!this.bird.isDead) this.bird.takeDamage();
    });

    this.physics.add.overlap(this.poops, this.mushrooms, (poop, mushroom) => {
      if (!mushroom.isDead) { poop.destroy(); mushroom.takeDamage(); }
    });

    this.createStartMenu(w, h);
    this.createPauseMenu(w, h);
    this.createGameOverMenu(w, h);

    this.cameras.main.fadeIn(1000, 0, 0, 0);
    
    this.add.text(w/2, 100, "FASE 2 - O VAZIO", { fontSize: '40px', fontFamily: 'KenneyRocket', fill: '#f0f' }).setOrigin(0.5).setDepth(600);
  }

  spawnMonsters(time, delta) {
    if (this.isBossSpawned || !this.isGameStarted || this.isGameOver || this.isPaused) return;

    this.spawnTimer += delta;
    if (this.spawnTimer > 2000) { 
      this.spawnTimer = 0;
      const w = this.scale.width;
      const h = this.scale.height;

      if (Phaser.Math.Between(0, 100) < 60) {
        const m = new Mushroom(this, w + 100, h - 50);
        this.mushrooms.add(m);
        this.physics.add.collider(m, this.ground);
      } else {
        const b = new Bee(this, w + 100, Phaser.Math.Between(100, h - 200));
        this.bees.add(b);
      }
    }
  }

  startBossSequence() {
    if (this.isBossSpawned) return;
    this.isBossSpawned = true;

    // Para o cenário suavemente
    this.tweens.add({
      targets: this,
      bgSpeedFactor: 0,
      duration: 3000,
      ease: 'Power2',
      onComplete: () => {
        this.spawnBoss();
      }
    });
  }

  spawnBoss() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.boss = new SwordBoss(this, w / 2, h / 2);
    this.physics.add.collider(this.boss, this.ground);
    this.physics.add.overlap(this.bird, this.boss, (bird, boss) => {
        if (!bird.isDead && !boss.isDead && (boss.anims.currentAnim.key === 'boss_spin_attack' || boss.anims.currentAnim.key === 'boss_heavy_attack')) {
            bird.takeDamage();
        }
    });
    this.physics.add.overlap(this.poops, this.boss, (poop, boss) => {
        if (!boss.isDead) {
            poop.destroy();
            boss.takeDamage();
        }
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (this.key1 && Phaser.Input.Keyboard.JustDown(this.key1)) {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => { this.scene.start('CreditsScene'); });
    }
    if (this.keyB && Phaser.Input.Keyboard.JustDown(this.keyB)) {
        this.startBossSequence();
    }
    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
    if (this.isPaused) return;

    if (this.bird && this.bird.isDead) {
      if (this.bird.y > this.scale.height + 50) { this.isGameOver = true; this.gameOverGroup.setVisible(true); }
      return;
    }

    this.bgLayers.forEach(layer => { 
        layer.sprite.tilePositionX += layer.speed * this.bgSpeedFactor; 
    });

    if (this.isGameStarted) {
      this.spawnMonsters(time, delta);
      this.bird.update(this.cursors);
      this.mushrooms.getChildren().forEach(m => m.update(this.bird, time, delta));
      this.bees.getChildren().forEach(b => b.update(this.bird));
      if (this.boss) this.boss.update(this.bird, time, delta);
      this.poops.getChildren().forEach(p => p.update());
    } else {
      this.bird.idleFloating(time);
    }
  }

  createHeartsHUD() {
    this.hearts.forEach(h => h.destroy());
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(40 + (i * 45), 40, 'hearth').setScale(1).setDepth(500).setScrollFactor(0);
      this.hearts.push(heart);
    }
  }
  updateHeartsHUD(lives) { this.hearts.forEach((h, i) => h.setVisible(i < lives)); }
  createAmmoHUD() {
    this.add.image(40, 85, 'poop_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.ammoText = this.add.text(65, 75, 'x 10', { fontSize: '24px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setDepth(500).setScrollFactor(0);
  }
  updateAmmoHUD(ammo) { if (this.ammoText) this.ammoText.setText('x ' + ammo); }

  createStartMenu(w, h) {
    this.startGroup = this.add.group();
    const titleText = this.add.text(w / 2, h / 2 - 100, 'FASE 2', { fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#fff' }).setOrigin(0.5).setDepth(100);
    const startBtn = this.add.text(w / 2, h / 2 + 50, 'INICIAR TESTE', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#330066', padding: { x: 30, y: 15 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    this.startGroup.add(titleText); this.startGroup.add(startBtn);
    startBtn.on('pointerdown', () => { this.isGameStarted = true; this.startGroup.clear(true, true); });
  }

  createPauseMenu(w, h) {
    this.pauseGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0).setDepth(200);
    const pauseText = this.add.text(w / 2, h / 2 - 50, 'PAUSED', { fontSize: '80px', fontFamily: 'KenneyRocket', fill: '#fff' }).setOrigin(0.5).setDepth(201);
    const resumeBtn = this.add.text(w / 2, h / 2 + 50, 'RESUME', { fontSize: '40px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#4e2e2e', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(201);
    this.pauseGroup.add(overlay); this.pauseGroup.add(pauseText); this.pauseGroup.add(resumeBtn);
    this.pauseGroup.setVisible(false);
    resumeBtn.on('pointerdown', () => this.togglePause());
  }

  createGameOverMenu(w, h) {
    this.gameOverGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0).setDepth(300);
    const deadText = this.add.text(w / 2, h / 2 - 80, 'GAME OVER', { fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#f00', stroke: '#000', strokeThickness: 10 }).setOrigin(0.5).setDepth(301);
    const restartBtn = this.add.text(w / 2, h / 2 + 60, 'RESTART', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#333', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(301);
    this.gameOverGroup.add(overlay); this.gameOverGroup.add(deadText); this.gameOverGroup.add(restartBtn);
    this.gameOverGroup.setVisible(false);
    restartBtn.on('pointerdown', () => { this.isGameOver = false; this.scene.restart(); });
  }

  togglePause() {
    if (!this.isGameStarted || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.pauseGroup.setVisible(this.isPaused);
    if (this.isPaused) this.physics.pause(); else this.physics.resume();
  }
}
