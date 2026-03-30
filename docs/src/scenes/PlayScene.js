import Bird from '../objects/Bird.js';
import Mushroom from '../objects/Mushroom.js';
import Bee from '../objects/Bee.js';
import Poop from '../objects/Poop.js';
import Flicker from '../objects/Flicker.js';
import Orange from '../objects/Orange.js';
import Fairy from '../objects/Fairy.js';
import BlueCoin from '../objects/BlueCoin.js';
import GoldCoin from '../objects/GoldCoin.js';
import Fruit from '../objects/Fruit.js';
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
    this.coins = null;
    this.goldCoins = null;
    this.fruits = null;
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
    this.shieldIcons = [];

    // --- ROUND MANAGER STATE ---
    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false; // Tarefa 2
    this.isRoundTransitioning = false; // Tarefa 5
    this.roundRecipes = [
      { round: 1, flickers: 3, mushrooms: 0, bees: 0, fruits: 2, coins: 1 },
      { round: 2, flickers: 0, mushrooms: 4, bees: 0, fruits: 2, coins: 2 },
      { round: 3, flickers: 4, mushrooms: 3, bees: 2, fruits: 3, coins: 10 },
      { round: 4, flickers: 6, mushrooms: 4, bees: 4, fruits: 4, coins: 15 },
      { round: 5, flickers: 10, mushrooms: 6, bees: 6, fruits: 5, coins: 20 }
    ];
  }

  preload() {
    Bird.preload(this);
    Mushroom.preload(this);
    Bee.preload(this);
    Flicker.preload(this);
    Orange.preload(this);
    Fairy.preload(this);
    BlueCoin.preload(this);
    GoldCoin.preload(this);
    Fruit.preload(this);
    this.load.image('hearth', 'assets/hearth.png');
    this.load.image('hearth_dead', 'assets/item1167.png');
    this.load.image('shield_icon', 'assets/item199.png');
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
    this.bgLayers = [];
    this.hearts = [];
    this.shieldIcons = [];
    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;

    const w = this.scale.width;
    const h = this.scale.height;

    Bird.createAnimations(this);
    Mushroom.createAnimations(this);
    Bee.createAnimations(this);
    Flicker.createAnimations(this);
    Orange.createAnimations(this);
    Fairy.createAnimations(this);
    BlueCoin.createAnimations(this);
    GoldCoin.createAnimations(this);

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

    this.bird = new Bird(this, -500, h / 2); 
    this.bird.setDepth(50);
    if (this.bird.body) this.bird.body.enable = false;

    this.physics.add.collider(this.bird, this.ground, () => {
      if (!this.bird.isDead) this.bird.takeDamage();
    });

    this.mushrooms = this.add.group();
    this.bees = this.add.group();
    this.flickers = this.add.group();
    this.coins = this.add.group();
    this.goldCoins = this.add.group();
    this.fruits = this.add.group();
    this.poops = this.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.createHeartsHUD();
    this.createAmmoHUD();
    this.createShieldInventoryHUD();
    this.createProgressionHUD();

    this.events.on('updateLives', (data) => this.updateHeartsHUD(data));
    this.events.on('updateAmmo', (ammo) => this.updateAmmoHUD(ammo));
    this.events.on('updateStoredShields', (count) => this.updateShieldInventoryHUD(count));
    this.events.on('updateProgress', (data) => this.updateProgressionHUD(data));

    this.physics.add.overlap(this.poops, this.mushrooms, (poop, mushroom) => {
      if (!mushroom.isDead) { poop.destroy(); mushroom.takeDamage(); }
    });

    this.physics.add.overlap(this.poops, this.flickers, (poop, flicker) => {
      if (!flicker.isDead) { poop.destroy(); flicker.takeDamage(); }
    });

    this.physics.add.overlap(this.bird, this.flickers, (bird, flicker) => {
      if (!flicker.isDead && !bird.isDead) {
        bird.takeDamage();
        flicker.die();
      }
    });

    this.physics.add.overlap(this.bird, this.mushrooms, (bird, mushroom) => {
      if (!mushroom.isDead && !bird.isDead) {
        bird.takeDamage();
      }
    });

    this.physics.add.overlap(this.bird, this.coins, (bird, coin) => {
        if (!bird.isDead && !coin.isCollected) {
            coin.collect();
            bird.collectShieldItem();
            bird.gainExperience(5, 50);
        }
    });

    this.physics.add.overlap(this.bird, this.goldCoins, (bird, coin) => {
        if (!bird.isDead && !coin.isCollected) {
            coin.collect(bird);
        }
    });

    this.physics.add.overlap(this.bird, this.fruits, (bird, fruit) => {
        if (!bird.isDead && !fruit.isCollected) {
            fruit.collect(bird);
        }
    });

    this.createStartMenu(w, h);
    this.createPauseMenu(w, h);
    this.createGameOverMenu(w, h);

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.bird.setVisible(false);
    this.setHUDAlpha(0);
  }

  setHUDAlpha(alpha) {
    this.hearts.forEach(h => h.setAlpha(alpha));
    this.shieldIcons.forEach(s => s.setAlpha(alpha));
    if (this.ammoIcon) this.ammoIcon.setAlpha(alpha);
    if (this.ammoText) this.ammoText.setAlpha(alpha);
    if (this.shieldInvIcon) this.shieldInvIcon.setAlpha(alpha);
    if (this.shieldInvText) this.shieldInvText.setAlpha(alpha);
    if (this.scoreText) this.scoreText.setAlpha(alpha);
    if (this.levelText) this.levelText.setAlpha(alpha);
    if (this.xpBarBg) this.xpBarBg.setAlpha(alpha);
    if (this.xpBar) this.xpBar.setAlpha(alpha);
  }

  startCinematicIntro() {
    const h = this.scale.height;
    this.bird.setPosition(-150, h / 2);
    this.bird.setVisible(true);
    if (this.bird.body) this.bird.body.enable = true;
    this.tweens.add({
        targets: this.bird,
        x: 150,
        duration: 3000,
        ease: 'Power2.easeOut',
        onComplete: () => {
            this.isGameStarted = true;
            this.bird.setCollideWorldBounds(true);
            this.startRound();
            this.tweens.add({
                targets: [
                    ...this.hearts,
                    ...this.shieldIcons,
                    this.ammoIcon, this.ammoText,
                    this.shieldInvIcon, this.shieldInvText, 
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

  // --- ROUND MANAGER METHODS ---

  startRound() {
    if (this.isGameOver) return;

    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    if (!recipe) {
        this.startTransitionToPhase2();
        return;
    }

    const w = this.scale.width;
    const h = this.scale.height;

    const roundText = this.add.text(w / 2, h / 2, `ROUND ${this.currentRound}`, {
        fontFamily: 'KenneyRocket',
        fontSize: '64px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 8
    }).setOrigin(0.5).setDepth(1000);

    this.tweens.add({
        targets: roundText,
        alpha: 0,
        y: h / 2 - 100,
        duration: 2000,
        ease: 'Power2',
        onComplete: () => roundText.destroy()
    });

    // Reseta flags do Round (Tarefas 2 e 5)
    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;
    
    this.spawnQueue = [];
    for (let i = 0; i < recipe.flickers; i++) this.spawnQueue.push('flicker');
    for (let i = 0; i < recipe.mushrooms; i++) this.spawnQueue.push('mushroom');
    for (let i = 0; i < recipe.bees; i++) this.spawnQueue.push('bee');
    for (let i = 0; i < recipe.fruits; i++) this.spawnQueue.push('fruit');
    for (let i = 0; i < recipe.coins; i++) this.spawnQueue.push('coin');

    Phaser.Utils.Array.Shuffle(this.spawnQueue);
    this.processSpawnQueue();
  }

  processSpawnQueue() {
    if (this.isGameOver || this.isPaused) return;

    if (this.spawnQueue.length === 0) {
        this.isSpawningFinished = true; // Tarefa 2: Sinalizador de geração concluída
        return;
    }

    const type = this.spawnQueue.shift();
    const w = this.scale.width;
    const h = this.scale.height;

    switch (type) {
        case 'flicker':
            const fx = Phaser.Math.Between(w + 100, w + 800);
            const fy = Phaser.Math.Between(100, h - 200);
            const f = new Flicker(this, fx, fy);
            this.flickers.add(f);
            break;
        case 'mushroom':
            const side = Phaser.Math.Between(0, 1);
            const mx = (side === 0) ? -100 : w + 100;
            const m = new Mushroom(this, mx, h - 50);
            this.mushrooms.add(m);
            this.physics.add.collider(m, this.ground);
            break;
        case 'bee':
            const b = new Bee(this, w + 100, Phaser.Math.Between(100, h - 300));
            this.bees.add(b);
            break;
        case 'fruit':
            const frX = Phaser.Math.Between(w + 100, w + 600);
            const frY = Phaser.Math.Between(250, 400);
            const frType = Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']);
            const fr = new Fruit(this, frX, frY, frType);
            this.fruits.add(fr);
            break;
        case 'coin':
            const cX = Phaser.Math.Between(w + 100, w + 600);
            const cY = Phaser.Math.Between(150, h - 150);
            const c = new GoldCoin(this, cX, cY);
            this.goldCoins.add(c);
            break;
    }

    this.time.delayedCall(3500, () => this.processSpawnQueue());
  }

  checkRoundEnd() {
    // Tarefa 4: Nova regra de avanço
    if (this.isSpawningFinished && !this.isRoundTransitioning) {
        // Tarefa 3 e 7: Verificador contínuo (ignora frutas e moedas)
        const totalEnemies = this.flickers.countActive(true) + 
                             this.mushrooms.countActive(true) + 
                             this.bees.countActive(true);
        
        if (totalEnemies === 0) {
            this.isRoundTransitioning = true; // Tarefa 5: Trava de segurança
            
            // Tarefa 6: O Descanso e o Próximo Round
            this.time.delayedCall(3000, () => {
                this.currentRound++;
                this.startRound();
            });
        }
    }
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

    if (this.bird) {
        if (this.isGameStarted) {
            this.bird.update(this.cursors);
            this.checkRoundEnd(); // Verifica fim do round a cada frame
        } else {
            this.bird.idleFloating(time);
        }
    }

    this.mushrooms.getChildren().forEach(m => m.update(this.bird, time, delta));
    this.bees.getChildren().forEach(b => b.update(this.bird));
    this.flickers.getChildren().forEach(f => f.update());
    this.coins.getChildren().forEach(c => c.update());
    this.goldCoins.getChildren().forEach(c => c.update());
    this.fruits.getChildren().forEach(f => f.update(time));
    this.poops.getChildren().forEach(p => p.update());
  }

  createHeartsHUD() {
    const h = this.scale.height;
    this.hearts.forEach(h => h.destroy());
    this.shieldIcons.forEach(s => s.destroy());
    this.hearts = [];
    this.shieldIcons = [];
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(40 + (i * 45), h - 25, 'hearth').setScale(1).setDepth(500).setScrollFactor(0);
      this.hearts.push(heart);
    }
    for (let i = 0; i < 3; i++) {
      const shield = this.add.image(180 + (i * 35), h - 25, 'shield_icon').setScale(1.5).setDepth(500).setScrollFactor(0);
      shield.setVisible(false);
      this.shieldIcons.push(shield);
    }
  }

  updateHeartsHUD(data) {
    const lives = data.lives !== undefined ? data.lives : 3;
    const shields = data.shields !== undefined ? data.shields : 0;
    this.hearts.forEach((h, i) => {
      h.setTexture(i < lives ? 'hearth' : 'hearth_dead');
    });
    this.shieldIcons.forEach((s, i) => {
      s.setVisible(i < shields);
    });
  }

  createAmmoHUD() {
    const h = this.scale.height;
    this.ammoIcon = this.add.image(320, h - 25, 'poop_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.ammoText = this.add.text(345, h - 35, 'x 10', { fontSize: '24px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 3 }).setDepth(500).setScrollFactor(0);
  }

  updateAmmoHUD(ammo) {
    if (this.ammoText) this.ammoText.setText('x ' + ammo);
  }

  createShieldInventoryHUD() {
    const h = this.scale.height;
    this.shieldInvIcon = this.add.image(440, h - 25, 'shield_item_icon').setScale(1.5).setDepth(500).setScrollFactor(0);
    this.shieldInvText = this.add.text(465, h - 35, 'x 0', { fontSize: '24px', fontFamily: 'KenneyPixel', fill: '#0ff', stroke: '#000', strokeThickness: 3 }).setDepth(500).setScrollFactor(0);
  }

  updateShieldInventoryHUD(count) {
    if (this.shieldInvText) this.shieldInvText.setText('x ' + count);
  }

  createProgressionHUD() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.scoreText = this.add.text(40, 40, 'SCORE: 0', { fontSize: '32px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setDepth(500).setScrollFactor(0);
    this.levelText = this.add.text(w - 180, h - 35, 'LVL: 1', { fontSize: '28px', fontFamily: 'KenneyRocket', fill: '#fb0', stroke: '#000', strokeThickness: 3 }).setDepth(500).setScrollFactor(0);
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
