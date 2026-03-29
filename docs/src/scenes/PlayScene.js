import Bird from '../objects/Bird.js';
import Mushroom from '../objects/Mushroom.js';
import Bee from '../objects/Bee.js';
import Poop from '../objects/Poop.js';
import Flicker from '../objects/Flicker.js';
import Orange from '../objects/Orange.js';
import Fairy from '../objects/Fairy.js';
import MagicProjectile from '../objects/MagicProjectile.js';
import SwordBoss from '../objects/SwordBoss.js';

export default class PlayScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PlayScene' });
    this.bgLayers = [];
    this.bird = null;
    this.boss = null;
    this.mushrooms = null;
    this.bees = null;
    this.flickers = null;
    this.oranges = null;
    this.fairies = null;
    this.magicProjectiles = null;
    this.poops = null;
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isTransitioning = false;
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
    this.isTransitioning = false;
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

    const groundHeight = 50; 
    this.ground = this.add.rectangle(-2000, h - groundHeight, w + 4000, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    this.bird = new Bird(this, -500, h / 2); // Começa bem longe
    this.bird.setDepth(50);
    if (this.bird.body) this.bird.body.enable = false; // Desativa física inicial

    this.physics.add.collider(this.bird, this.ground, () => {
      if (!this.bird.isDead) this.bird.takeDamage();
    });

    this.mushrooms = this.add.group();
    this.bees = this.add.group();
    this.poops = this.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createHeartsHUD();
    this.createAmmoHUD();
    this.createProgressionHUD();

    this.events.on('updateLives', (lives) => this.updateHeartsHUD(lives));
    this.events.on('updateAmmo', (ammo) => this.updateAmmoHUD(ammo));
    this.events.on('updateProgress', (data) => this.updateProgressionHUD(data));

    this.physics.add.overlap(this.poops, this.mushrooms, (poop, mushroom) => {
      if (!mushroom.isDead) { poop.destroy(); mushroom.takeDamage(); }
    });

    this.createStartMenu(w, h);
    this.createPauseMenu(w, h);
    this.createGameOverMenu(w, h);

    // Fade-in ao iniciar a cena
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Tori e HUD começam totalmente invisíveis
    this.bird.setVisible(false);
    this.setHUDAlpha(0);
  }

  setHUDAlpha(alpha) {
    this.hearts.forEach(h => h.setAlpha(alpha));
    if (this.ammoIcon) this.ammoIcon.setAlpha(alpha);
    if (this.ammoText) this.ammoText.setAlpha(alpha);
    if (this.scoreText) this.scoreText.setAlpha(alpha);
    if (this.levelText) this.levelText.setAlpha(alpha);
    if (this.xpBarBg) this.xpBarBg.setAlpha(alpha);
    if (this.xpBar) this.xpBar.setAlpha(alpha);
  }

  startCinematicIntro() {
    const h = this.scale.height;
    
    // 1. Garante posição e visibilidade
    this.bird.setPosition(-150, h / 2);
    this.bird.setVisible(true);
    if (this.bird.body) this.bird.body.enable = true; // Ativa a física agora
    
    // 2. Voo suave até o ponto inicial
    this.tweens.add({
        targets: this.bird,
        x: 100,
        duration: 2500,
        ease: 'Power2.easeOut',
        onComplete: () => {
            // 3. Após chegar, inicia o jogo e a HUD
            this.isGameStarted = true;

            this.tweens.add({
                targets: [
                    ...this.hearts, 
                    this.ammoIcon, this.ammoText, 
                    this.scoreText, this.levelText, 
                    this.xpBarBg, this.xpBar
                ],
                alpha: 1,
                duration: 1500,
                ease: 'Linear'
            });
        }
    });
  }

  spawnMonsters(time, delta) {
    if (this.isBossSpawned || !this.isGameStarted || this.isGameOver || this.isPaused) return;

    this.spawnTimer += delta;
    if (this.spawnTimer > 2500) { 
      this.spawnTimer = 0;
      const w = this.scale.width;
      const h = this.scale.height;

      if (Phaser.Math.Between(0, 100) < 70) {
        const m = new Mushroom(this, w + 100, h - 50);
        this.mushrooms.add(m);
        this.physics.add.collider(m, this.ground);
      } else {
        const b = new Bee(this, w + 100, Phaser.Math.Between(100, h - 200));
        this.bees.add(b);
      }
    }
  }

  startTransitionToPhase2() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const w = this.scale.width;
      const h = this.scale.height;
      this.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0).setDepth(999);
      this.add.text(w / 2, h / 2, 'FASE 2', { fontSize: '80px', fontFamily: 'KenneyRocket', fill: '#fff' }).setOrigin(0.5).setDepth(1000);
      this.time.delayedCall(2000, () => { this.scene.start('Phase2Scene'); });
    });
  }

  update(time, delta) {
    if (this.isGameOver) return;
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
      this.poops.getChildren().forEach(p => p.update());
    } else {
      this.bird.idleFloating(time);
    }
  }

  createHeartsHUD() {
    const h = this.scale.height;
    this.hearts.forEach(h => h.destroy());
    this.hearts = [];
    for (let i = 0; i < 3; i++) {
      // Posicionado no canto inferior esquerdo, na área do chão
      const heart = this.add.image(40 + (i * 45), h - 25, 'hearth').setScale(1).setDepth(500).setScrollFactor(0);
      this.hearts.push(heart);
    }
  }

  updateHeartsHUD(lives) {
    this.hearts.forEach((h, i) => h.setVisible(i < lives));
  }

  createAmmoHUD() {
    const h = this.scale.height;
    // Posicionado logo após os corações
    this.ammoIcon = this.add.image(200, h - 25, 'poop_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.ammoText = this.add.text(225, h - 35, 'x 10', { fontSize: '24px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setDepth(500).setScrollFactor(0);
  }

  updateAmmoHUD(ammo) {
    if (this.ammoText) this.ammoText.setText('x ' + ammo);
  }

  createProgressionHUD() {
    const w = this.scale.width;
    const h = this.scale.height;
    // SCORE continua no canto superior esquerdo
    this.scoreText = this.add.text(40, 40, 'SCORE: 0', { fontSize: '32px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setDepth(500).setScrollFactor(0);

    // LEVEL no canto inferior direito
    this.levelText = this.add.text(w - 180, h - 35, 'LVL: 1', { fontSize: '28px', fontFamily: 'KenneyRocket', fill: '#fb0', stroke: '#000', strokeThickness: 3 }).setDepth(500).setScrollFactor(0);

    // Barra de XP discretamente acima do LEVEL
    this.xpBarBg = this.add.rectangle(w - 200, h - 50, 160, 8, 0x333333).setOrigin(0, 0).setDepth(500).setScrollFactor(0);
    this.xpBar = this.add.rectangle(w - 200, h - 50, 0, 8, 0x00ff00).setOrigin(0, 0).setDepth(501).setScrollFactor(0);
  }

  updateProgressionHUD(data) {
    if (this.scoreText) this.scoreText.setText('SCORE: ' + data.score);
    if (this.levelText) this.levelText.setText('LVL: ' + data.level);
    this.xpBar.width = 160 * (data.xp / data.xpNextLevel);
  }

  createStartMenu(w, h) {
    this.startGroup = this.add.group();
    const titleText = this.add.text(w / 2, h / 2 - 100, 'TORI-TORI', { fontSize: '120px', fontFamily: 'KenneyRocket', fill: '#fff', stroke: '#000', strokeThickness: 10 }).setOrigin(0.5).setDepth(100);
    const startBtn = this.add.text(w / 2, h / 2 + 50, 'PRESS START', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#2e3b4e', padding: { x: 30, y: 15 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    this.startGroup.add(titleText); this.startGroup.add(startBtn);
    startBtn.on('pointerdown', () => { 
        this.startGroup.clear(true, true); 
        this.startCinematicIntro();
    });
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
