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
import RedCoin from '../objects/RedCoin.js';

export default class Phase2Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Phase2Scene' });
    this.bgLayers = [];
    this.bird = null;
    this.boss = null;
    this.mushrooms = null;
    this.bees = null;
    this.oranges = null;
    this.fairies = null;
    this.enemyProjectiles = null;
    this.coins = null;
    this.goldCoins = null;
    this.fruits = null;
    this.poops = null;
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isBossSpawned = false;
    this.bgSpeedFactor = 1.0;
    this.spawnTimer = 0;
    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;
    this.isBossTransitioning = false;
    this.roundRecipes = [
        { 
            round: 1, scripted: true, 
            sequence: [
                { type: 'flicker', ultimate: true, delay: 5000 },
                { type: 'wait_clear' },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'orange', delay: 2000 },
                { type: 'blue_coin', delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 2, scripted: true, 
            sequence: [
                { type: 'fairy', delay: 0 },
                { type: 'wait_clear' },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'flicker', upgraded: true, delay: 0 },
                { type: 'orange', delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 3, scripted: true, 
            sequence: [
                { type: 'mushroom', ultimate: true, delay: 2000 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'wait_clear' },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 4, scripted: true, 
            sequence: [
                { type: 'flicker', upgraded: true, delay: 3000 },
                { type: 'bee', upgraded: true, delay: 3000 },
                { type: 'fairy', delay: 3000 },
                { type: 'orange', delay: 3000 },
                { type: 'mushroom', upgraded: true, delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 5, scripted: true, 
            sequence: [
                { type: 'fairy', ultimate: true, delay: 2000 },
                { type: 'flicker', ultimate: true, delay: 2000 },
                { type: 'bee', ultimate: true, delay: 2000 },
                { type: 'orange', ultimate: true, delay: 2000 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 6, scripted: true, 
            sequence: [
                { type: 'flicker', ultimate: true, delay: 500 },
                { type: 'bee', ultimate: true, delay: 500 },
                { type: 'orange', ultimate: true, delay: 3000 },
                { type: 'wait_clear' },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'mushroom', ultimate: true, delay: 4000 },
                { type: 'wait_clear' },
                { type: 'flicker', ultimate: true, x: 2000, y: 200, delay: 0 },
                { type: 'flicker', ultimate: true, x: 2000, y: 500, delay: 0 },
                { type: 'flicker', ultimate: true, x: 2000, y: 800, delay: 0 },
                { type: 'wait_clear' }
            ]
        }
    ];
    this.onFairyShoot = null;
    this.debugKey = null;
    this.xpDebugKey = null;
    this.muteKey = null;
    this.hearts = [];
    this.shieldIcons = [];
    this.birdData = null; 
  }

  init(data) {
    if (data && data.level) {
        this.birdData = data;
    }
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
    RedCoin.preload(this);
    Fruit.preload(this);
    SwordBoss.preload(this);
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
    this.load.audio('bgm_phase2', 'assets/soundtrack/phase2.mp3');
    this.load.audio('bgm_pause', 'assets/soundtrack/pause.mp3');
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
    this.shieldIcons = [];

    const w = 1920;
    const h = 1080;

    Bird.createAnimations(this);
    Mushroom.createAnimations(this);
    Bee.createAnimations(this);
    Flicker.createAnimations(this);
    Orange.createAnimations(this);
    Fairy.createAnimations(this);
    BlueCoin.createAnimations(this);
    GoldCoin.createAnimations(this);
    RedCoin.createAnimations(this);
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

    // CORREÇÃO: Altura original do chão preservada (60). O Boss é que será ajustado a ele!
    const groundHeight = 60; 
    this.ground = this.add.rectangle(-2000, h - groundHeight, w + 4000, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    this.bird = new Bird(this, -200, h / 2); 
    this.bird.setDepth(50);
    if (this.bird.body) this.bird.body.enable = false; 

    this.mushrooms = this.add.group();
    this.bees = this.add.group();
    this.flickers = this.add.group();
    this.coins = this.add.group();
    this.goldCoins = this.add.group();
    this.fruits = this.add.group();
    this.poops = this.add.group();

    this.physics.world.setBounds(0, 0, w, h);
    this.physics.world.setBoundsCollision(true, true, true, false); 
    
    this.oranges = this.add.group();
    this.fairies = this.add.group();
    this.enemyProjectiles = this.add.group();

    this.physics.add.collider(this.oranges, this.ground);
    this.physics.add.collider(this.mushrooms, this.ground); 

    this.onFairyShoot = (proj) => {
      if (proj && proj.active) this.enemyProjectiles.add(proj);
    };
    this.events.on('fairyShoot', this.onFairyShoot);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('fairyShoot', this.onFairyShoot);
    });

    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.xpDebugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.bossDebugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    this.createHeartsHUD();
    this.createAmmoHUD();
    this.createShieldInventoryHUD();
    this.createHealInventoryHUD();
    this.createProgressionHUD();

    this.events.on('updateLives', (data) => this.updateHeartsHUD(data));
    this.events.on('updateAmmo', (ammo) => this.updateAmmoHUD(ammo));
    this.events.on('updateStoredShields', (count) => this.updateShieldInventoryHUD(count));
    this.events.on('updateStoredHeals', (count) => this.updateHealInventoryHUD(count));
    this.events.on('updateProgress', (data) => this.updateProgressionHUD(data));
    this.events.on('updateMaxLives', (maxLives) => this.rebuildHeartsHUD(maxLives));

    if (this.birdData) {
        this.bird.syncFromData(this.birdData);
    }

    this.physics.add.collider(this.bird, this.ground, () => {
      if (!this.bird.isDead) this.bird.takeDamage();
    });

    const handleEnemyCollision = (bird, enemy) => {
        if (enemy.isDead || bird.isDead) return;
        if (bird.isDashing) {
            if (bird.dashHitEnemies && bird.dashHitEnemies.has(enemy)) return;
            if (bird.dashHitEnemies) bird.dashHitEnemies.add(enemy);

            if (typeof enemy.takeDamage === 'function') enemy.takeDamage(bird.dashDamage || 1);
            else enemy.die();
        } else {
            bird.takeDamage();
        }
    };

    const birdEnemyGroups = [this.mushrooms, this.bees, this.flickers, this.oranges, this.fairies];
    birdEnemyGroups.forEach(group => {
      this.physics.add.overlap(this.bird, group, handleEnemyCollision);
    });

    const handlePoopHit = (poop, enemy) => {
      if (!poop.active || !enemy.active || enemy.isDead) return;

      if (poop.isExploding) {
          if (poop.hitEnemies && poop.hitEnemies.has(enemy)) return;
          if (poop.hitEnemies) poop.hitEnemies.add(enemy);
      }

      const projectileDamage = poop.damage || 1;
      const enemyCurrentHP = Math.max(enemy.hp || 1, 1);

      if (typeof enemy.takeDamage === 'function') {
        enemy.takeDamage(projectileDamage);
      } else if (typeof enemy.die === 'function') {
        enemy.die();
      }

      if (!poop.isExploding) {
        if (projectileDamage > enemyCurrentHP) {
          poop.damage = projectileDamage - enemyCurrentHP;
          if (poop.auraFX) {
              poop.auraFX.outerStrength = Math.max(poop.auraFX.outerStrength - 1, 0);
          }
        } else {
          poop.destroy();
        }
      }
    };

    const poopEnemyGroups = [...birdEnemyGroups, this.enemyProjectiles];
    poopEnemyGroups.forEach(group => {
      this.physics.add.overlap(this.poops, group, handlePoopHit);
    });

    this.physics.add.collider(this.poops, this.ground, (poop) => {
      if (poop && poop.active && !poop.isExploding) poop.explode();
    });

    this.physics.add.overlap(this.bird, this.enemyProjectiles, (bird, proj) => {
      if (!bird.isDead && !bird.isDashing && !bird.isInvincible) {
        bird.takeDamage();
      }
      if (proj && proj.active) proj.destroy();
    });

    this.physics.add.overlap(this.bird, this.coins, (bird, coin) => {
      if (!bird.isDead && !coin.isCollected) {
        coin.collect(bird);
      }
    });
    this.physics.add.overlap(this.bird, this.goldCoins, (bird, coin) => {
      if (!bird.isDead && !coin.isCollected) coin.collect(bird);
    });
    this.physics.add.overlap(this.bird, this.fruits, (bird, fruit) => {
      if (!bird.isDead && !fruit.isCollected) fruit.collect(bird);
    });

    this.anims.resumeAll(); 
    this.physics.resume();

    this.createPauseMenu(w, h);
    this.createGameOverMenu(w, h);

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.bird.setVisible(false);
    this.setHUDAlpha(0);
    
    this.startCinematicIntro();

    this.time.delayedCall(3600, () => {
      if (!this.isGameStarted && !this.isGameOver) {
        this.isGameStarted = true;
        this.startRound();
      }
    });

    const phaseTitle = this.add.text(w / 2, h / 2, 'FASE 2 - O VAZIO', {
      fontSize: '84px',
      fontFamily: 'KenneyRocket',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({
      targets: phaseTitle,
      alpha: 0,
      y: (h / 2) - 140,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => phaseTitle.destroy()
    });

    this.sound.stopAll();
    this.bgmPhase2 = this.sound.add('bgm_phase2', { loop: true, volume: 0 });
    this.bgmPause = this.sound.add('bgm_pause', { loop: true, volume: 0.3 });

    this.bgmPhase2.play();
    this.tweens.add({
        targets: this.bgmPhase2,
        volume: 0.4,
        duration: 2000
    });
  }

  setHUDAlpha(alpha) {
    this.hearts.forEach(h => h.setAlpha(alpha)); this.shieldIcons.forEach(s => s.setAlpha(alpha));
    if (this.ammoIcon) this.ammoIcon.setAlpha(alpha); if (this.ammoText) this.ammoText.setAlpha(alpha);
    if (this.shieldInvIcon) this.shieldInvIcon.setAlpha(alpha); if (this.shieldInvText) this.shieldInvText.setAlpha(alpha);
    if (this.healInvIcon) this.healInvIcon.setAlpha(alpha); if (this.healInvText) this.healInvText.setAlpha(alpha);
    if (this.scoreText) this.scoreText.setAlpha(alpha * 0.5); 
    if (this.levelText) this.levelText.setAlpha(alpha);
    if (this.xpBarBgGraphics) this.xpBarBgGraphics.setAlpha(alpha);
    if (this.xpBarGraphics) this.xpBarGraphics.setAlpha(alpha);
    if (this.roundBarBg) this.roundBarBg.setAlpha(alpha * 0.6); 
    if (this.roundBarFill) this.roundBarFill.setAlpha(alpha * 0.8);
    if (this.roundHeaderText) this.roundHeaderText.setAlpha(alpha * 0.8);
  }

  startCinematicIntro() {
    const h = 1080;
    
    this.bird.setPosition(-200, h / 2);
    this.bird.setVisible(true);
    if (this.bird.body) this.bird.body.enable = true;
    
    this.tweens.add({
        targets: this.bird,
      x: 300,
        duration: 3000,
        ease: 'Power2.easeOut',
        onComplete: () => {
            this.isGameStarted = true;
            if (this.bird.body) {
                this.bird.body.setCollideWorldBounds(true);
            }
          this.startRound();

            this.time.addEvent({
                delay: 4000,
                callback: () => {
                    if (this.isGameStarted && !this.isGameOver && !this.isPaused && !this.isBossTransitioning) {
                        const w = 1920;
                        const fruitType = Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']);
                        this.fruits.add(new Fruit(this, w + 200, Phaser.Math.Between(300, 600), fruitType));
                    }
                },
                loop: true
            });

            this.tweens.add({
                targets: [
                    ...this.hearts, ...this.shieldIcons,
                    this.ammoIcon, this.ammoText, 
                    this.shieldInvIcon, this.shieldInvText,
                    this.healInvIcon, this.healInvText,
                    this.levelText, 
                    this.xpBarBgGraphics, this.xpBarGraphics,
                    this.roundBarFill
                ],
                alpha: 1,
                duration: 1500,
                ease: 'Linear'
            });

            this.tweens.add({
                targets: this.scoreText,
                alpha: 0.5,
                duration: 1500,
                ease: 'Linear'
            });

            this.tweens.add({
                targets: [this.roundBarBg],
                alpha: 0.6,
                duration: 1500,
                ease: 'Linear'
            });
            this.tweens.add({
                targets: [this.roundHeaderText],
                alpha: 0.8,
                duration: 1500,
                ease: 'Linear'
            });
        }
    });
  }

  spawnMonsters(time, delta) {
    if (!this.isGameStarted || this.isPaused || this.isGameOver || this.isBossSpawned) return;
    if (!this.isSpawningFinished && this.spawnQueue.length === 0) this.isSpawningFinished = true;
  }

  startRound() {
    if (this.isGameOver || this.isBossSpawned) return;

    if (this.currentRound > 6) {
        this.startBossTransition();
        return;
    }

    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    if (!recipe) {
      this.startBossSequence();
      return;
    }

    const w = 1920;
    const h = 1080;
    const txt = this.add.text(
      w / 2,
      h / 2,
      `ROUND ${this.currentRound}`,
      { fontFamily: 'KenneyRocket', fontSize: '88px', fill: '#fff', stroke: '#000', strokeThickness: 10 }
    ).setOrigin(0.5).setDepth(900);
    this.tweens.add({ targets: txt, alpha: 0, y: (h / 2) - 180, duration: 2400, ease: 'Power2', onComplete: () => txt.destroy() });

    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;
    
    if (recipe.scripted) {
        this.spawnQueue = [...recipe.sequence];
    } else {
        this.spawnQueue = [];
        for (let i = 0; i < (recipe.oranges || 0); i++) this.spawnQueue.push({ type: 'orange' });
        for (let i = 0; i < (recipe.fairies || 0); i++) this.spawnQueue.push({ type: 'fairy' });
        for (let i = 0; i < (recipe.mushrooms || 0); i++) this.spawnQueue.push({ type: 'mushroom' });
        for (let i = 0; i < (recipe.bees || 0); i++) this.spawnQueue.push({ type: 'bee' });
        for (let i = 0; i < (recipe.flickers || 0); i++) this.spawnQueue.push({ type: 'flicker' });
        for (let i = 0; i < (recipe.fruits || 0); i++) this.spawnQueue.push({ type: 'fruit' });
        for (let i = 0; i < (recipe.coins || 0); i++) this.spawnQueue.push({ type: 'coin' });
        Phaser.Utils.Array.Shuffle(this.spawnQueue);
    }
    
    this.updateRoundHUD();
    this.processSpawnQueue();
  }

  processSpawnQueue() {
    if (this.isGameOver || this.isBossSpawned) return;
    
    if (this.isPaused) {
        this.time.delayedCall(500, () => this.processSpawnQueue());
        return;
    }
    
    if (this.spawnQueue.length === 0) {
      this.isSpawningFinished = true;
      return;
    }

    const step = this.spawnQueue.shift();
    const type = typeof step === 'string' ? step : step.type;
    
    if (type === 'wait_clear') {
        const totalActiveEnemies = this.oranges.countActive(true)
          + this.fairies.countActive(true)
          + this.mushrooms.countActive(true)
          + this.bees.countActive(true)
          + this.flickers.countActive(true);

        if (totalActiveEnemies === 0) {
            this.updateRoundHUD();
            this.processSpawnQueue(); 
        } else {
            this.spawnQueue.unshift(step); 
            this.time.delayedCall(1000, () => this.processSpawnQueue());
        }
        return;
    }

    const w = 1920;
    const h = 1080;

    switch (type) {
      case 'orange': {
        const spawnX = step.x !== undefined ? step.x : (Phaser.Math.Between(0, 1) === 0 ? -500 : w + 500);
        const orange = new Orange(this, spawnX, h - 60); 
        if (step.ultimate) orange.ultimateUpgrade();
        else if (step.upgraded || this.currentRound >= 3) orange.upgrade();
        this.oranges.add(orange);
        break;
      }
      case 'fairy': {
        const spawnX = step.x !== undefined ? step.x : w + 200;
        const spawnY = step.y !== undefined ? step.y : Phaser.Math.Between(120, h - 280);
        const fairy = new Fairy(this, spawnX, spawnY);
        if (step.ultimate) fairy.ultimateUpgrade();
        else if (step.upgraded || this.currentRound >= 3) fairy.upgrade();
        this.fairies.add(fairy);
        break;
      }
      case 'mushroom': {
        const spawnX = step.x !== undefined ? step.x : w + 100;
        const mushroom = new Mushroom(this, spawnX, h - 90); 
        this.mushrooms.add(mushroom);
        this.physics.add.collider(mushroom, this.ground);
        
        if (step.ultimate) mushroom.ultimateUpgrade();
        else if (step.upgraded || this.currentRound >= 3) mushroom.upgrade();
        break;
      }
      case 'bee': {
        const spawnX = step.x !== undefined ? step.x : w + 200;
        const spawnY = step.y !== undefined ? step.y : Phaser.Math.Between(100, h - 320);
        const bee = new Bee(this, spawnX, spawnY);
        this.bees.add(bee);
        
        if (step.ultimate) bee.ultimateUpgrade();
        else if (step.upgraded || this.currentRound >= 3) bee.upgrade();
        break;
      }
      case 'flicker': {
        const spawnX = step.x !== undefined ? step.x : w + 200;
        const spawnY = step.y !== undefined ? step.y : Phaser.Math.Between(100, h - 200);
        const flicker = new Flicker(this, spawnX, spawnY);
        this.flickers.add(flicker);
        
        if (step.ultimate) flicker.ultimateUpgrade();
        else if (step.upgraded || this.currentRound >= 3) flicker.upgrade();
        break;
      }
      case 'fruit': {
        const spawnX = step.x !== undefined ? step.x : w + 200;
        const spawnY = step.y !== undefined ? step.y : Phaser.Math.Between(300, 600);
        const fruitType = step.fruitType || Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']);
        this.fruits.add(new Fruit(this, spawnX, spawnY, fruitType));
        break;
      }
      case 'coin': {
        const spawnX = step.x !== undefined ? step.x : w + 200;
        const spawnY = step.y !== undefined ? step.y : Phaser.Math.Between(220, h - 320);
        this.goldCoins.add(new GoldCoin(this, spawnX, spawnY));
        break;
      }
      case 'blue_coin': {
          const spawnX = step.x !== undefined ? step.x : w + 200;
          const spawnY = step.y !== undefined ? step.y : 540;
          this.coins.add(new BlueCoin(this, spawnX, spawnY));
          break;
      }
      case 'red_coin': {
          const spawnX = step.x !== undefined ? step.x : w + 200;
          const spawnY = step.y !== undefined ? step.y : 540;
          this.coins.add(new RedCoin(this, spawnX, spawnY));
          break;
      }
    }

    this.updateRoundHUD();
    const delay = step.delay !== undefined ? step.delay : 2000;
    this.time.delayedCall(delay, () => this.processSpawnQueue());
  }

  checkRoundEnd() {
    if (this.isRoundTransitioning || this.isBossSpawned || this.isBossTransitioning) return;
    if (!this.isSpawningFinished) return;

    const totalActiveEnemies = this.oranges.countActive(true)
      + this.fairies.countActive(true)
      + this.mushrooms.countActive(true)
      + this.bees.countActive(true)
      + this.flickers.countActive(true);

    if (totalActiveEnemies !== 0) return;

    this.isRoundTransitioning = true;
    if (this.currentRound === 4) {
      this.coins.add(new BlueCoin(this, 2120, 540));
    }

    this.time.delayedCall(2200, () => {
      this.currentRound++;
      if (this.currentRound > 6) {
        this.startBossTransition();
      } else {
        this.startRound();
      }
    });
  }

  startBossTransition() {
    if (this.isBossTransitioning) return; 
    this.isBossTransitioning = true;
    
    this.bird.isControlLocked = true;
    this.bird.setFlipX(false); 

    if (this.bird.body) {
        this.bird.body.setVelocity(0, 0); 
        this.bird.body.setAllowGravity(false); 
    }
    
    const groupsToClear = [this.fruits, this.oranges, this.fairies, this.mushrooms, this.bees, this.flickers, this.enemyProjectiles];
    groupsToClear.forEach(group => {
        if (group) {
            group.getChildren().forEach(item => {
                this.tweens.add({ targets: item, alpha: 0, duration: 500, onComplete: () => item.destroy() });
            });
        }
    });

    const h = 1080;
    const w = 1920;
    
    this.tweens.add({
        targets: this.bird,
        x: 400,       
        y: h / 2,     
        duration: 2500,
        ease: 'Sine.easeInOut',
        onComplete: () => {
            console.log("Transição concluída. O palco está pronto para o Boss!");
            
            // O Segredo está aqui: A gravidade já vem ligada do construtor dele, 
            // e nós "largamos" ele lá no céu (y=200). Ele vai cair direto pro chão antes da tela abrir!
            this.boss = new SwordBoss(this, w + 300, 200); 
            
            this.physics.add.collider(this.boss, this.ground);
            
            this.physics.add.overlap(this.bird, this.boss, (bird, boss) => {
                if (!bird.isDead && !boss.isDead && (boss.anims.currentAnim.key === 'boss_spin' || boss.anims.currentAnim.key === 'boss_dash_attack')) {
                    bird.takeDamage();
                }
            });
            
            this.physics.add.overlap(this.poops, this.boss, (poop, boss) => {
                if (!boss.isDead) {
                    poop.destroy(); 
                    
                    if (boss.anims.currentAnim.key !== 'boss_spin') {
                        boss.takeDamage(this.bird.getShootDamage());
                    }
                }
            });
        }
    });
  }

  startBossSequence() {
    if (this.isBossSpawned) return;
    this.isBossSpawned = true;

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
        if (!bird.isDead && !boss.isDead && (boss.anims.currentAnim.key === 'boss_spin' || boss.anims.currentAnim.key === 'boss_dash_attack')) {
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

    if (this.muteKey && Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      this.sound.mute = !this.sound.mute;
    }

    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
    if (this.isPaused) return;
    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) this.debugSkipRound();
    if (this.xpDebugKey && Phaser.Input.Keyboard.JustDown(this.xpDebugKey) && this.bird) this.bird.gainExperience(100, 0);

    if (this.bossDebugKey && Phaser.Input.Keyboard.JustDown(this.bossDebugKey)) {
        this.currentRound = 7;
        this.startRound();
    }

    if (this.bird && this.bird.isDead) {
      if (this.bird.y > this.scale.height + 50 && !this.isGameOver) { 
        this.isGameOver = true; 
        if (this.bgmPhase2) this.bgmPhase2.stop();
        this.sound.play('sfx_game_over', { loop: false });

        this.gameOverGroup.setVisible(true);
        this.tweens.add({
          targets: this.gameOverOverlay,
          alpha: 0.8,
          duration: 1000
        });
        this.tweens.add({
          targets: [this.gameOverText, this.gameOverBtn],
          alpha: 1,
          duration: 1000
        });
      }
      return;
    }

    if (!this.isBossTransitioning) {
        this.bgLayers.forEach(layer => { 
            layer.sprite.tilePositionX += layer.speed * this.bgSpeedFactor; 
        });
    }

    if (this.isGameStarted) {
      this.bird.update(this.cursors);
      this.spawnMonsters(time, delta);
      this.checkRoundEnd();
      
      this.mushrooms.getChildren().forEach(m => m.update(this.bird, time, delta));
      this.bees.getChildren().forEach(b => b.update(this.bird));
      this.flickers.getChildren().forEach(f => f.update(this.bird));
      this.poops.getChildren().forEach(p => p.update());
      this.coins.getChildren().forEach(c => c.update && c.update());
      this.goldCoins.getChildren().forEach(c => c.update && c.update());
      this.fruits.getChildren().forEach(f => f.update && f.update(time));
      
      this.oranges.getChildren().forEach(o => o.update(this.bird, time, delta));
      this.fairies.getChildren().forEach(f => f.update(this.bird, time, delta));
      this.enemyProjectiles.getChildren().forEach(p => {
          if(p.update) p.update(time, delta);
      });

      if (this.boss) this.boss.update(this.bird, time, delta);
    } else {
      this.bird.idleFloating(time);
    }
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
    
    for (let i = 0; i < maxLives; i++) {
      const heart = this.add.image(40 + (i * 45), h - 25, 'hearth').setScale(1).setDepth(500).setScrollFactor(0);
      this.hearts.push(heart);
    }
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
    const initialAmmo = this.bird ? this.bird.ammo : 10;
    this.ammoText = this.add.text(565, iconY, 'x ' + initialAmmo, { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(500).setScrollFactor(0);
  }

  updateAmmoHUD(ammo) { if (this.ammoText) this.ammoText.setText('x ' + ammo); }

  createShieldInventoryHUD() {
    const h = 1080; const iconY = h - 30;
    this.shieldInvIcon = this.add.image(720, iconY, 'shield_item_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.shieldInvText = this.add.text(765, iconY, 'x 0', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#0ff', stroke: '#000', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(500).setScrollFactor(0);
  }

  updateShieldInventoryHUD(count) { if (this.shieldInvText) this.shieldInvText.setText('x ' + count); }

  createHealInventoryHUD() {
    const h = 1080; const iconY = h - 30;
    this.healInvIcon = this.add.image(920, iconY, 'heal_item_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.healInvText = this.add.text(965, iconY, 'x 0', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#0f0', stroke: '#000', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(500).setScrollFactor(0);
  }

  updateHealInventoryHUD(count) { if (this.healInvText) this.healInvText.setText('x ' + count); }

  createProgressionHUD() {
    const w = 1920; const h = 1080;
    
    this.scoreText = this.add.text(60, 60, 'SCORE: 0', { fontSize: '72px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 8 }).setDepth(500).setScrollFactor(0).setAlpha(0);

    const barW = 250; const barH = 30; const barX = w - 60 - barW; const barY = h - 25 - barH;
    const rBarW = 300; const rBarH = 20; const rBarX = barX - rBarW - 40; const rBarY = barY + 5;

    this.roundBarBg = this.add.graphics().setDepth(500).setScrollFactor(0);
    this.roundBarBg.fillStyle(0x333333, 0.6); 
    this.roundBarBg.fillRoundedRect(rBarX, rBarY, rBarW, rBarH, 10);
    this.roundBarBg.lineStyle(2, 0xffffff, 0.6); 
    this.roundBarBg.strokeRoundedRect(rBarX, rBarY, rBarW, rBarH, 10);

    this.roundBarFill = this.add.graphics().setDepth(501).setScrollFactor(0);
    
    this.roundHeaderText = this.add.text(rBarX + rBarW/2, rBarY - 25, 'ROUND 1', { 
        fontSize: '20px', fontFamily: 'KenneyRocket', fill: '#fff' 
    }).setOrigin(0.5, 0).setDepth(502).setScrollFactor(0).setAlpha(0);
    this.roundHeaderText.setAlpha(0); 

    this.xpBarBgGraphics = this.add.graphics().setDepth(500).setScrollFactor(0);
    this.xpBarBgGraphics.fillStyle(0x333333, 0.8); this.xpBarBgGraphics.fillRoundedRect(barX, barY, barW, barH, 15);
    this.xpBarBgGraphics.lineStyle(2, 0xffffff, 1); this.xpBarBgGraphics.strokeRoundedRect(barX, barY, barW, barH, 15);
    this.xpBarGraphics = this.add.graphics().setDepth(501).setScrollFactor(0);
    const maskShape = this.add.graphics().setDepth(0).setScrollFactor(0).setVisible(false);
    maskShape.fillRoundedRect(barX, barY, barW, barH, 15);
    this.xpBarGraphics.setMask(maskShape.createGeometryMask());
    
    this.levelText = this.add.text(barX + barW / 2, barY + barH / 2, 'LEVEL 1', { 
        fontSize: '18px', 
        fontFamily: 'KenneyRocket', 
        fill: '#ffffff', 
        stroke: '#000000', 
        strokeThickness: 3 
    }).setOrigin(0.5).setDepth(502).setScrollFactor(0);

    this.xpBarData = { x: barX, y: barY, w: barW, h: barH };
    this.roundBarData = { x: rBarX, y: rBarY, w: rBarW, h: rBarH }; 
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

  updateRoundHUD() {
    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    if (!recipe) return;

    const total = recipe.scripted ? recipe.sequence.length : 10; 
    const remaining = this.spawnQueue.length;
    const progress = Math.max(0, Math.min(1, (total - remaining) / total));

    this.roundBarFill.clear();
    this.roundBarFill.fillStyle(0xe600ac, 0.8); 
    
    const { x, y, w, h } = this.roundBarData;
    this.roundBarFill.fillRoundedRect(x, y, w * progress, h, 10);
    this.roundHeaderText.setText(`ROUND ${this.currentRound}`);
  }

  createPauseMenu(w, h) {
    this.pauseGroup = this.add.group();
    
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.85).setOrigin(0).setDepth(1000);
    
    const pauseTitle = this.add.text(w / 2, 180, '- PAUSADO -', { 
        fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#ffffff', stroke: '#000', strokeThickness: 10 
    }).setOrigin(0.5).setDepth(1001);
    
    const panelW = 1000; const panelH = 450;
    const statsBg = this.add.rectangle(w / 2, h / 2 + 20, panelW, panelH, 0x0d111a, 0.95).setDepth(1001).setStrokeStyle(4, 0x00aaff);
    
    const line = this.add.rectangle(w / 2, h / 2 + 20, 4, panelH - 40, 0x00aaff, 0.5).setDepth(1001);

    const leftTitle = this.add.text(w / 2 - 250, h / 2 - 160, 'ATRIBUTOS DO TORI', { 
        fontSize: '40px', fontFamily: 'KenneyPixel', fill: '#00aaff' 
    }).setOrigin(0.5).setDepth(1002);
    
    const rightTitle = this.add.text(w / 2 + 250, h / 2 - 160, 'CONTROLES E INVENTÁRIO', { 
        fontSize: '40px', fontFamily: 'KenneyPixel', fill: '#00aaff' 
    }).setOrigin(0.5).setDepth(1002);

    this.statsTextLeft = this.add.text(w / 2 - 450, h / 2 - 100, '', { 
        fontSize: '38px', fontFamily: 'KenneyPixel', fill: '#ffffff', lineSpacing: 20 
    }).setDepth(1002);

    this.statsTextRight = this.add.text(w / 2 + 50, h / 2 - 100, '', { 
        fontSize: '38px', fontFamily: 'KenneyPixel', fill: '#ffffff', lineSpacing: 20 
    }).setDepth(1002);

    this.pauseShieldIcon = this.add.image(w / 2 + 420, h / 2 + 152, 'shield_item_icon').setScale(1.5).setDepth(1002);
    this.pauseHealIcon = this.add.image(w / 2 + 420, h / 2 + 210, 'heal_item_icon').setScale(1.5).setDepth(1002);

    const btnStyle = { fontSize: '45px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 5 };
    
    const resumeBtn = this.add.text(w / 2, h / 2 + 330, ' CONTINUAR ', { ...btnStyle, backgroundColor: '#2d5a27', padding: {x: 20, y: 10} })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1001);
        
    const restartBtn = this.add.text(w / 2 - 250, h / 2 + 330, ' REINICIAR FASE ', { ...btnStyle, backgroundColor: '#8a2b2b', padding: {x: 20, y: 10} })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1001);
        
    const homeBtn = this.add.text(w / 2 + 250, h / 2 + 330, ' MENU PRINCIPAL ', { ...btnStyle, backgroundColor: '#444444', padding: {x: 20, y: 10} })
        .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1001);

    this.pauseGroup.addMultiple([
        overlay, pauseTitle, statsBg, line, leftTitle, rightTitle, 
        this.statsTextLeft, this.statsTextRight, 
        this.pauseShieldIcon, this.pauseHealIcon,
        resumeBtn, restartBtn, homeBtn
    ]);
    this.pauseGroup.setVisible(false);

    resumeBtn.on('pointerdown', () => this.togglePause());
    restartBtn.on('pointerdown', () => { this.isGameOver = false; this.scene.restart(); });
    homeBtn.on('pointerdown', () => { window.location.reload(); });
  }

  updatePauseStats() {
    if (!this.bird) return;
    const dashDmg = this.bird.getDashDamage();
    const poopDmg = this.bird.getShootDamage();

    const leftText = 
        `NÍVEL ATUAL: ${this.bird.level}\n` +
        `PONTUAÇÃO: ${this.bird.score}\n` +
        `VIDAS: ${this.bird.lives} / ${this.bird.maxLives}\n\n` +
        `DANO DO DASH: ${dashDmg}\n` +
        `DANO DO COCO: ${poopDmg}\n` +
        `MUNIÇÃO: ${this.bird.ammo} / ${this.bird.maxAmmo}`;
    const rightText = 
        `[ SETAS ]  MOVER\n` +
        `[ D ]  DASH (Invencível)\n` +
        `[ESPAÇO]  ATIRAR\n\n\n` +
        `[   S   ]  USAR ESCUDO    x ${this.bird.storedShields}\n` +
        `[   R   ]  USAR CURA      x ${this.bird.storedHeals}`;

    this.statsTextLeft.setText(leftText);
    this.statsTextRight.setText(rightText);
  }

  createGameOverMenu(w, h) {
    this.gameOverGroup = this.add.group();
    this.gameOverOverlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0).setDepth(300);
    this.gameOverText = this.add.text(w / 2, h / 2 - 80, 'GAME OVER', { fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#f00', stroke: '#000', strokeThickness: 10 }).setOrigin(0.5).setDepth(301);
    this.gameOverBtn = this.add.text(w / 2, h / 2 + 60, 'RESTART', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#333', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(301);
    
    this.gameOverOverlay.setAlpha(0);
    this.gameOverText.setAlpha(0);
    this.gameOverBtn.setAlpha(0);

    this.gameOverGroup.add(this.gameOverOverlay); 
    this.gameOverGroup.add(this.gameOverText); 
    this.gameOverGroup.add(this.gameOverBtn);
    this.gameOverGroup.setVisible(false);

    this.gameOverBtn.on('pointerdown', () => { 
        this.tweens.add({
            targets: [this.gameOverOverlay, this.gameOverText, this.gameOverBtn],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.isGameOver = false; 
                this.scene.restart(); 
            }
        });
    });
  }

  debugSkipRound() {
    this.spawnQueue = [];
    this.isSpawningFinished = true;
    this.fairies.getChildren().forEach(f => f.die && f.die());
    this.oranges.getChildren().forEach(o => o.die && o.die());
    this.mushrooms.getChildren().forEach(m => m.die && m.die());
    this.bees.getChildren().forEach(b => b.die && b.die());
    this.flickers.getChildren().forEach(f => f.die && f.die());
    this.enemyProjectiles.getChildren().forEach(p => p.destroy && p.destroy());
  }

  togglePause() {
    if (!this.isGameStarted || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.pauseGroup.setVisible(this.isPaused);
    
    if (this.isPaused) {
        this.physics.pause();
        this.anims.pauseAll(); 
        
        this.updatePauseStats();

        if (this.bgmPhase2) this.bgmPhase2.pause(); 
        if (this.bgmPause) this.bgmPause.play();
    } else {
        this.physics.resume();
        this.anims.resumeAll(); 
        if (this.bgmPause) this.bgmPause.stop();
        if (this.bgmPhase2) this.bgmPhase2.resume(); 
    }
  }
}
