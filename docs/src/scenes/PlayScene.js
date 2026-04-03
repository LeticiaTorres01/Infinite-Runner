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
    this.poops = null;
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isTransitioning = false;
    this.bgSpeedFactor = 1.0;
    this.hearts = [];
    this.shieldIcons = [];

    // --- ROUND MANAGER STATE ---
    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false; 
    this.isRoundTransitioning = false; 

    this.roundRecipes = [
        // --- INTRODUÇÃO (Apresentação espaçada) ---
        // Round 1: Apenas os Flickers (obstáculos estáticos). Tempo longo para o jogador se acostumar com o voo.
        { round: 1, flickers: 6, mushrooms: 0, bees: 0, oranges: 0, fruits: 7, coins: 2, spawnDelay: 3500 },
        // Round 2: Apenas Cogumelos. Ensina que o perigo vem de baixo.
        { round: 2, flickers: 0, mushrooms: 6, bees: 0, fruits: 8, coins: 2, spawnDelay: 3200 },
        // Round 3: Apenas Abelhas. Ensina a mecânica de investida (dash) vinda do alto.
        { round: 3, flickers: 0, mushrooms: 0, bees: 4, fruits: 2, coins: 3, spawnDelay: 3000 },

        // --- SINERGIA (Misturando os perigos) ---
        // Round 4: Parede estática + Puladores.
        { round: 4, flickers: 4, mushrooms: 4, bees: 0, fruits: 7, coins: 3, spawnDelay: 2500 },
        // Round 5: O Ataque aéreo e terrestre (O jogador precisa ficar no meio da tela).
        { round: 5, flickers: 0, mushrooms: 4, bees: 4, fruits: 7, coins: 4, spawnDelay: 2200 },
        // Round 6: O Trio. Todos os monstros aparecem juntos pela primeira vez.
        { round: 6, flickers: 3, mushrooms: 3, bees: 3, fruits: 7, coins: 5, spawnDelay: 2000 },

        // --- PRESSÃO (Obriga o uso de tiros/cocô para abrir caminho) ---
        // Round 7: Foco em barreira terrestre forte com suporte aéreo.
        { round: 7, flickers: 5, mushrooms: 6, bees: 3, fruits: 8, coins: 6, spawnDelay: 1600 },
        // Round 8: Foco em enxame aéreo forte com obstáculos terrestres.
        { round: 8, flickers: 5, mushrooms: 3, bees: 6, fruits: 9, coins: 6, spawnDelay: 1400 },
        // Round 9: Pré-Clímax. Caos equilibrado.
        { round: 9, flickers: 6, mushrooms: 6, bees: 6, fruits: 9, coins: 8, spawnDelay: 1100 },

        // --- CLÍMAX (Teste de Sobrevivência) ---
        // Round 10: O limite da Fase 1. Spawns extremamente rápidos, tela cheia.
        { round: 10, flickers: 8, mushrooms: 8, bees: 8, fruits: 9, coins: 10, spawnDelay: 800 }
    ];
  }

  preload() {
    Bird.preload(this); Mushroom.preload(this); Bee.preload(this); Flicker.preload(this);
    Orange.preload(this); Fairy.preload(this); BlueCoin.preload(this); GoldCoin.preload(this); Fruit.preload(this);
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
    const w = 1920; const h = 1080;
    this.isGameStarted = false; this.isPaused = false; this.isGameOver = false;
    this.isTransitioning = false; this.bgSpeedFactor = 1.0;
    this.bgLayers = []; this.hearts = []; this.shieldIcons = [];
    this.currentRound = 1; this.spawnQueue = [];
    this.isSpawningFinished = false; this.isRoundTransitioning = false;

    Bird.createAnimations(this); Mushroom.createAnimations(this); Bee.createAnimations(this);
    Flicker.createAnimations(this); Orange.createAnimations(this); Fairy.createAnimations(this);
    BlueCoin.createAnimations(this); GoldCoin.createAnimations(this);

    const addLayer = (key, speed, isLight = false) => {
      const texture = this.textures.get(key);
      const img = texture.getSourceImage();
      const imgHeight = (img && img.height) ? img.height : 512;
      const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
      const scale = h / imgHeight;
      sprite.setScale(scale);
      sprite.width = w / scale;
      if (isLight) { sprite.setBlendMode(Phaser.BlendModes.ADD); sprite.setAlpha(0.4); }
      this.bgLayers.push({ sprite: sprite, speed: speed });
    };

    addLayer('ceu_sombrio', 0.02); addLayer('bg_cielo', 0.1); addLayer('bg_arvores_fundo', 0.2); addLayer('bg_luzes_fundo', 0.3, true);
    addLayer('bg_arvores_densas', 0.5); addLayer('bg_arvores_medias', 0.7); addLayer('bg_luzes_frente', 0.8, true);
    addLayer('bg_arvores_finas', 1.0); addLayer('bg_arbustos', 1.2); addLayer('bg_grama_fundo', 1.5); addLayer('bg_chao', 2.0);

    const groundHeight = 60; 
    this.ground = this.add.rectangle(-2000, h - groundHeight, w + 4000, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    this.bird = new Bird(this, -200, h / 2); this.bird.setDepth(50);
    if (this.bird.body) this.bird.body.enable = false;

    this.physics.add.collider(this.bird, this.ground, () => { if (!this.bird.isDead) this.bird.takeDamage(); });

    this.mushrooms = this.add.group(); this.bees = this.add.group(); this.flickers = this.add.group();
    this.coins = this.add.group(); this.goldCoins = this.add.group(); this.fruits = this.add.group();
    this.poops = this.add.group(); this.oranges = this.add.group();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.xpDebugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);

    this.createHeartsHUD();
    this.createAmmoHUD();
    this.createShieldInventoryHUD();
    this.createProgressionHUD();

    this.events.on('updateLives', (data) => this.updateHeartsHUD(data));
    this.events.on('updateAmmo', (ammo) => this.updateAmmoHUD(ammo));
    this.events.on('updateStoredShields', (count) => this.updateShieldInventoryHUD(count));
    this.events.on('updateProgress', (data) => this.updateProgressionHUD(data));
    this.events.on('updateMaxLives', (maxLives) => this.rebuildHeartsHUD(maxLives));

    this.physics.add.overlap(this.poops, this.mushrooms, (poop, mushroom) => { if (!mushroom.isDead) { poop.destroy(); mushroom.takeDamage(); } });
    this.physics.add.overlap(this.poops, this.flickers, (poop, flicker) => { if (!flicker.isDead) { poop.destroy(); flicker.takeDamage(); } });
    this.physics.add.overlap(this.poops, this.bees, (poop, bee) => { if (!bee.isDead) { poop.destroy(); bee.takeDamage(); } });
    this.physics.add.overlap(this.poops, this.oranges, (poop, orange) => { if (!orange.isDead) { poop.destroy(); orange.takeDamage(); } });
    this.physics.add.overlap(this.bird, this.flickers, (bird, flicker) => { if (!flicker.isDead && !bird.isDead) { bird.takeDamage(); flicker.die(); } });
    this.physics.add.overlap(this.bird, this.bees, (bird, bee) => { if (!bee.isDead && !bird.isDead) { bird.takeDamage(); bee.die(); } });
    this.physics.add.overlap(this.bird, this.mushrooms, (bird, mushroom) => { if (!mushroom.isDead && !bird.isDead) { bird.takeDamage(); } });
    this.physics.add.overlap(this.bird, this.oranges, (bird, orange) => { if (!orange.isDead && !bird.isDead) { bird.takeDamage(); } });

    // Colisor para o Tori causar dano nos inimigos durante o dash
    this.physics.add.overlap(this.bird, this.mushrooms, (bird, enemy) => {
        if (bird.isDashing && !enemy.isDead) {
            enemy.takeDamage(bird.dashDamage);
        }
    });
    this.physics.add.overlap(this.bird, this.bees, (bird, enemy) => {
        if (bird.isDashing && !enemy.isDead) {
            enemy.takeDamage(bird.dashDamage);
        }
    });

    this.physics.add.overlap(this.bird, this.coins, (bird, coin) => { if (!bird.isDead && !coin.isCollected) { coin.collect(); bird.collectShieldItem(); bird.gainExperience(5, 50); } });
    this.physics.add.overlap(this.bird, this.goldCoins, (bird, coin) => { if (!bird.isDead && !coin.isCollected) { coin.collect(bird); } });
    this.physics.add.overlap(this.bird, this.fruits, (bird, fruit) => { if (!bird.isDead && !fruit.isCollected) { fruit.collect(bird); } });

    this.createStartMenu(w, h); this.createPauseMenu(w, h); this.createGameOverMenu(w, h);
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.bird.setVisible(false); this.setHUDAlpha(0);
  }

  setHUDAlpha(alpha) {
    this.hearts.forEach(h => h.setAlpha(alpha)); this.shieldIcons.forEach(s => s.setAlpha(alpha));
    if (this.ammoIcon) this.ammoIcon.setAlpha(alpha); if (this.ammoText) this.ammoText.setAlpha(alpha);
    if (this.shieldInvIcon) this.shieldInvIcon.setAlpha(alpha); if (this.shieldInvText) this.shieldInvText.setAlpha(alpha);
    if (this.scoreText) this.scoreText.setAlpha(alpha); if (this.levelText) this.levelText.setAlpha(alpha);
    if (this.xpBarBgGraphics) this.xpBarBgGraphics.setAlpha(alpha);
    if (this.xpBarGraphics) this.xpBarGraphics.setAlpha(alpha);
  }

  startCinematicIntro() {
    const h = 1080;
    this.bird.setPosition(-200, h / 2); this.bird.setVisible(true);
    if (this.bird.body) this.bird.body.enable = true;
    this.tweens.add({
        targets: this.bird, x: 300, duration: 3000, ease: 'Power2.easeOut',
        onComplete: () => {
            this.isGameStarted = true; this.bird.setCollideWorldBounds(true); this.startRound();
            this.tweens.add({
                targets: [ ...this.hearts, ...this.shieldIcons, this.ammoIcon, this.ammoText, this.shieldInvIcon, this.shieldInvText, this.scoreText, this.levelText, this.xpBarBgGraphics, this.xpBarGraphics ],
                alpha: 1, duration: 1500, ease: 'Linear'
            });
        }
    });
  }

  startRound() {
    if (this.isGameOver) return;
    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    if (!recipe) { this.startTransitionToPhase2(); return; }
    
    const w = 1920; const h = 1080;
    const roundText = this.add.text(w / 2, h / 2, `ROUND ${this.currentRound}`, { fontFamily: 'KenneyRocket', fontSize: '100px', fill: '#fff', stroke: '#000', strokeThickness: 12 }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({ targets: roundText, alpha: 0, y: h / 2 - 200, duration: 2500, ease: 'Power2', onComplete: () => roundText.destroy() });
    this.isSpawningFinished = false; this.isRoundTransitioning = false; this.spawnQueue = [];
    for (let i = 0; i < recipe.flickers; i++) this.spawnQueue.push('flicker');
    for (let i = 0; i < recipe.mushrooms; i++) this.spawnQueue.push('mushroom');
    for (let i = 0; i < recipe.bees; i++) this.spawnQueue.push('bee');
    for (let i = 0; i < (recipe.oranges || 0); i++) this.spawnQueue.push('orange');
    for (let i = 0; i < recipe.fruits; i++) this.spawnQueue.push('fruit');
    for (let i = 0; i < recipe.coins; i++) this.spawnQueue.push('coin');
    Phaser.Utils.Array.Shuffle(this.spawnQueue); this.processSpawnQueue();
  }

  processSpawnQueue() {
    if (this.isGameOver || this.isPaused) return;
    if (this.spawnQueue.length === 0) { this.isSpawningFinished = true; return; }
    
    const type = this.spawnQueue.shift(); const w = 1920; const h = 1080;
    switch (type) {
        case 'flicker':
            const fx = Phaser.Math.Between(w + 100, w + 800);
            const fy = Phaser.Math.Between(100, h - 200);
            const f = new Flicker(this, fx, fy);
            
            // Upgrade no Round 6+
            if (this.currentRound >= 6) f.upgrade();
            
            this.flickers.add(f);
            break;
        case 'mushroom':
            const mx = (Phaser.Math.Between(0, 1) === 0) ? -200 : w + 200;
            const m = new Mushroom(this, mx, h - 100);
            
            // Lógica de Upgrade: Maior que o turno 3
            if (this.currentRound > 3) {
                m.upgrade();
            }
            
            this.mushrooms.add(m);
            this.physics.add.collider(m, this.ground);
            break;
        case 'bee':
            const b = new Bee(this, w + 100, Phaser.Math.Between(100, h - 300));
            
            // Lógica de Upgrade: Round 7 ou superior
            if (this.currentRound >= 7) {
                b.upgrade(); // Substitui a atribuição manual e o setTint
            }
            
            this.bees.add(b);
            break;
        case 'orange':
            const ox = (Phaser.Math.Between(0, 1) === 0) ? -200 : w + 200;
            const o = new Orange(this, ox, h - 100); this.oranges.add(o); this.physics.add.collider(o, this.ground); break;
        case 'fruit': this.fruits.add(new Fruit(this, w + 200, Phaser.Math.Between(300, 600), Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']))); break;
        case 'coin': this.goldCoins.add(new GoldCoin(this, w + 200, Phaser.Math.Between(200, h - 300))); break;
    }

    // Busca a receita atual para aplicar o delay correto deste round (Tarefa 2)
    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    const currentDelay = recipe ? recipe.spawnDelay : 3000;

    this.time.delayedCall(currentDelay, () => this.processSpawnQueue());
  }

  checkRoundEnd() {
    if (this.isSpawningFinished && !this.isRoundTransitioning) {
        if (this.flickers.countActive(true) + this.mushrooms.countActive(true) + this.bees.countActive(true) + this.oranges.countActive(true) === 0) {
            
            // Adiciona uma Blue Coin no final do Round 7
            if (this.currentRound === 7) {
                const w = 1920; const h = 1080;
                this.coins.add(new BlueCoin(this, w + 200, h / 2));
            }

            this.isRoundTransitioning = true; 
            
            this.time.delayedCall(3000, () => { 
                this.currentRound++;
                
                // Trava de Transição de Fases (Tarefa 3)
                if (this.currentRound > this.roundRecipes.length) {
                    this.startTransitionToPhase2();
                } else {
                    this.startRound(); 
                }
            });
        }
    }
  }

  startTransitionToPhase2() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const w = 1920; const h = 1080;
      this.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0).setDepth(999);
      this.add.text(w / 2, h / 2, 'FASE 2', { fontSize: '80px', fontFamily: 'KenneyRocket', fill: '#fff' }).setOrigin(0.5).setDepth(1000);
      this.time.delayedCall(2000, () => { this.scene.start('Phase2Scene'); });
    });
  }

  debugSkipRound() {
    this.spawnQueue = []; this.isSpawningFinished = true;
    this.flickers.getChildren().forEach(f => f.die()); this.mushrooms.getChildren().forEach(m => m.die()); this.bees.getChildren().forEach(b => b.die()); this.oranges.getChildren().forEach(o => o.die());
  }

  update(time, delta) {
    if (this.isGameOver) return;
    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
    if (this.isPaused) return;
    if (Phaser.Input.Keyboard.JustDown(this.debugKey)) this.debugSkipRound();
    if (this.xpDebugKey && Phaser.Input.Keyboard.JustDown(this.xpDebugKey) && this.bird) this.bird.gainExperience(100, 0);
    if (this.bird && this.bird.isDead) { if (this.bird.y > 1080 + 100) { this.isGameOver = true; this.gameOverGroup.setVisible(true); } return; }
    this.bgLayers.forEach(layer => { layer.sprite.tilePositionX += layer.speed * this.bgSpeedFactor; });
    if (this.bird) { if (this.isGameStarted) { this.bird.update(this.cursors); this.checkRoundEnd(); } else { this.bird.idleFloating(time); } }
    this.mushrooms.getChildren().forEach(m => m.update(this.bird, time, delta));
    this.bees.getChildren().forEach(b => b.update(this.bird));
    this.flickers.getChildren().forEach(f => f.update(this.bird));
    this.oranges.getChildren().forEach(o => o.update(this.bird, time, delta));
    this.coins.getChildren().forEach(c => c.update());
    this.goldCoins.getChildren().forEach(c => c.update());
    this.fruits.getChildren().forEach(f => f.update(time));
    this.poops.getChildren().forEach(p => p.update());
  }

  createHeartsHUD() {
    const h = 1080; this.hearts.forEach(h => h.destroy()); this.shieldIcons.forEach(s => s.destroy());
    this.hearts = []; this.shieldIcons = []; const iconY = h - 30;
    for (let i = 0; i < 3; i++) { const heart = this.add.image(80 + (i * 65), iconY, 'hearth').setScale(1.5).setDepth(500).setScrollFactor(0); this.hearts.push(heart); }
    for (let i = 0; i < 3; i++) { const shield = this.add.image(300 + (i * 55), iconY, 'shield_icon').setScale(2).setDepth(500).setScrollFactor(0); shield.setVisible(false); this.shieldIcons.push(shield); }
  }

  rebuildHeartsHUD(maxLives) {
    const h = this.scale.height;
    this.hearts.forEach(h => h.destroy());
    this.hearts = [];
    
    // Agora desenha os corações com base no maxLives, não mais em '3' fixo
    for (let i = 0; i < maxLives; i++) {
      const heart = this.add.image(40 + (i * 45), h - 25, 'hearth').setScale(1).setDepth(500).setScrollFactor(0);
      this.hearts.push(heart);
    }
    // Força a atualização visual para mostrar cheios/vazios corretamente
    if (this.bird) {
        this.updateHeartsHUD({ lives: this.bird.lives, shields: this.bird.shields });
    }
  }

  updateHeartsHUD(data) {
    const lives = data.lives !== undefined ? data.lives : 3; const shields = data.shields !== undefined ? data.shields : 0;
    this.hearts.forEach((h, i) => { h.setTexture(i < lives ? 'hearth' : 'hearth_dead'); });
    this.shieldIcons.forEach((s, i) => { s.setVisible(i < shields); });
  }

  createAmmoHUD() {
    const h = 1080; const iconY = h - 30;
    this.ammoIcon = this.add.image(520, iconY, 'poop_icon').setScale(3).setDepth(500).setScrollFactor(0);
    this.ammoText = this.add.text(565, iconY, 'x 10', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(500).setScrollFactor(0);
  }

  updateAmmoHUD(ammo) { if (this.ammoText) this.ammoText.setText('x ' + ammo); }

  createShieldInventoryHUD() {
    const h = 1080; const iconY = h - 30;
    this.shieldInvIcon = this.add.image(720, iconY, 'shield_item_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.shieldInvText = this.add.text(765, iconY, 'x 0', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#0ff', stroke: '#000', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(500).setScrollFactor(0);
  }

  updateShieldInventoryHUD(count) { if (this.shieldInvText) this.shieldInvText.setText('x ' + count); }

  createProgressionHUD() {
    const w = 1920; const h = 1080;
    this.scoreText = this.add.text(60, 60, 'SCORE: 0', { fontSize: '72px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 8 }).setDepth(500).setScrollFactor(0);
    const barW = 400; const barH = 60; const barX = w - 60 - barW; const barY = h - 30 - barH;
    this.xpBarBgGraphics = this.add.graphics().setDepth(500).setScrollFactor(0);
    this.xpBarBgGraphics.fillStyle(0x333333, 0.8); this.xpBarBgGraphics.fillRoundedRect(barX, barY, barW, barH, 30);
    this.xpBarBgGraphics.lineStyle(4, 0xffffff, 1); this.xpBarBgGraphics.strokeRoundedRect(barX, barY, barW, barH, 30);
    this.xpBarGraphics = this.add.graphics().setDepth(501).setScrollFactor(0);
    const maskShape = this.add.graphics().setDepth(0).setScrollFactor(0).setVisible(false);
    maskShape.fillRoundedRect(barX, barY, barW, barH, 30);
    this.xpBarGraphics.setMask(maskShape.createGeometryMask());
    this.levelText = this.add.text(barX + barW/2, barY + barH/2, 'LEVEL 1', { fontSize: '32px', fontFamily: 'KenneyRocket', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(502).setScrollFactor(0);
    this.xpBarData = { x: barX, y: barY, w: barW, h: barH };
    this.drawXPBar(0);
  }

  drawXPBar(ratio) {
    const { x, y, w, h } = this.xpBarData;
    this.xpBarGraphics.clear();
    if (ratio > 0) { this.xpBarGraphics.fillStyle(0x00ff00, 1); this.xpBarGraphics.fillRect(x, y, w * ratio, h); }
  }

  updateProgressionHUD(data) {
    if (this.scoreText) this.scoreText.setText('SCORE: ' + data.score);
    if (this.levelText) this.levelText.setText('LEVEL ' + data.level);
    this.drawXPBar(data.xp / data.xpNextLevel);
  }

  createStartMenu(w, h) {
    this.startGroup = this.add.group();
    const titleText = this.add.text(w / 2, h / 2 - 150, 'TORI-TORI', { fontSize: '180px', fontFamily: 'KenneyRocket', fill: '#fff', stroke: '#000', strokeThickness: 15 }).setOrigin(0.5).setDepth(100);
    const startBtn = this.add.text(w / 2, h / 2 + 100, 'PRESS START', { fontSize: '80px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#2e3b4e', padding: { x: 50, y: 25 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    this.startGroup.add(titleText); this.startGroup.add(startBtn);
    startBtn.on('pointerdown', () => { this.startGroup.clear(true, true); this.startCinematicIntro(); });
  }

  createPauseMenu(w, h) {
    this.pauseGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7).setOrigin(0).setDepth(200);
    const pauseText = this.add.text(w / 2, h / 2 - 100, 'PAUSED', { fontSize: '120px', fontFamily: 'KenneyRocket', fill: '#fff' }).setOrigin(0.5).setDepth(201);
    const resumeBtn = this.add.text(w / 2, h / 2 + 100, 'RESUME', { fontSize: '60px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#4e2e2e', padding: { x: 40, y: 20 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(201);
    this.pauseGroup.add(overlay); this.pauseGroup.add(pauseText); this.pauseGroup.add(resumeBtn);
    this.pauseGroup.setVisible(false);
    resumeBtn.on('pointerdown', () => this.togglePause());
  }

  createGameOverMenu(w, h) {
    this.gameOverGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0).setDepth(300);
    const deadText = this.add.text(w / 2, h / 2 - 120, 'GAME OVER', { fontSize: '150px', fontFamily: 'KenneyRocket', fill: '#f00', stroke: '#000', strokeThickness: 15 }).setOrigin(0.5).setDepth(301);
    const restartBtn = this.add.text(w / 2, h / 2 + 60, 'RESTART', { fontSize: '80px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#333', padding: { x: 40, y: 20 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(301);
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
