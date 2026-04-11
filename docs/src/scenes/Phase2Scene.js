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
import SaveService from '../services/SaveService.js';
import { SettingsService } from '../services/SettingsService.js';
import { InputProfileService } from '../services/InputProfileService.js';

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
    this.isBossFightActive = false;
    this.bossFruitTimer = null;
    this.sfxMasterVolume = 1;
    this.roundRecipes = [
        { 
            round: 1, scripted: true, 
            sequence: [
                { type: 'flicker', ultimate: true, delay: 0 },
                { type: 'flicker', ultimate: true, delay: 0 },
                { type: 'flicker', ultimate: true, delay: 0 },
                { type: 'flicker', ultimate: true, delay: 0 },
                { type: 'fairy', delay: 0 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'flicker', ultimate: true, delay: 0 },
                { type: 'flicker', ultimate: true, delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'fairy', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'orange', delay: 2000 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'orange', delay: 2000 },
                { type: 'red_coin', delay: 0 },
                { type: 'fairy', delay: 0 },
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
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'fairy', delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'fairy', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'fairy', delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'wait_clear' },
                { type: 'red_coin', delay: 0 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'flicker', upgraded: true, delay: 0 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'orange', delay: 0 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 3, scripted: true, 
            sequence: [
                { type: 'mushroom', ultimate: true, delay: 2000 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'fairy', delay: 0 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'fairy', delay: 3000 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'mushroom', upgraded: true, delay: 2000 },
                { type: 'fairy', delay: 0 },
                { type: 'orange', ultimate: true, delay: 5000 },
                { type: 'wait_clear' },
                { type: 'fairy', delay: 3000 },
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'fairy', delay: 3000 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'fairy', delay: 3000 },
                { type: 'red_coin', delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 4, scripted: true, 
            sequence: [
                { type: 'flicker', upgraded: true, delay: 3000 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'bee', upgraded: true, delay: 3000 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'red_coin', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'fairy', delay: 3000 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'orange', delay: 3000 },
                { type: 'bee', ultimate: true, delay: 4000 },
                { type: 'mushroom', upgraded: true, delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'orange', ultimate: true, delay: 0 },
                { type: 'bee', ultimate: true, delay: 4000 },
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
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 2000 },
                { type: 'wait_clear' },
                { type: 'flicker', ultimate: true, delay: 2000 },
                { type: 'red_coin', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'bee', ultimate: true, delay: 2000 },
                { type: 'orange', ultimate: true, delay: 2000 },
                { type: 'red_coin', delay: 0 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 2000 },
                { type: 'flicker', ultimate: true, delay: 2000 },
                { type: 'wait_clear' },
                { type: 'bee', ultimate: true, delay: 2000 },
                { type: 'red_coin', delay: 0 },
                { type: 'orange', ultimate: true, delay: 2000 },
                { type: 'mushroom', ultimate: true, delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 6, scripted: true, 
            sequence: [
                { type: 'flicker', ultimate: true, delay: 500 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'bee', ultimate: true, delay: 500 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'orange', ultimate: true, delay: 3000 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'wait_clear' },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'mushroom', ultimate: true, delay: 4000 },
                { type: 'red_coin', delay: 0 },
                { type: 'red_coin', delay: 0 },
                { type: 'wait_clear' },
                { type: 'flicker', ultimate: true, x: 2000, y: 200, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'flicker', ultimate: true, x: 2000, y: 500, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'flicker', ultimate: true, x: 2000, y: 800, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'wait_clear' },
                { type: 'flicker', ultimate: true, delay: 500 },
                { type: 'bee', ultimate: true, delay: 500 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'orange', ultimate: true, delay: 3000 },
                { type: 'wait_clear' },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'mushroom', ultimate: true, delay: 4000 },
                { type: 'wait_clear' },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'flicker', ultimate: true, x: 2000, y: 200, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'flicker', ultimate: true, x: 2000, y: 500, delay: 0 },
                { type: 'flicker', ultimate: true, x: 2000, y: 800, delay: 0 },
                { type: 'fairy', ultimate: true, delay: 500 },
                { type: 'fairy', ultimate: true, delay: 500 },
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
    this.continueData = null;
    this.saveSlotId = null;
    this.lowHealthBorder = null;
    this.lowHealthTween = null;
  }

  init(data) {
    this.continueData = data && data.continueData ? data.continueData : null;
    this.saveSlotId = Number.isFinite(data && data.saveSlotId) ? Math.floor(data.saveSlotId) : null;

    if (this.continueData && this.continueData.birdData && this.continueData.currentPhase === 2) {
      this.birdData = this.continueData.birdData;
      this.currentRound = Phaser.Math.Clamp(Math.floor(this.continueData.currentRound || 1), 1, 7);
      if (Number.isFinite(this.continueData.slotId)) {
        this.saveSlotId = Math.floor(this.continueData.slotId);
      }
      return;
    }

    if (data && data.level) {
      this.birdData = data;
    }
  }

  getBirdSaveData() {
    if (!this.bird) return null;

    return {
      level: this.bird.level,
      xp: this.bird.xp,
      score: this.bird.score,
      ammo: this.bird.ammo,
      lives: this.bird.lives,
      maxLives: this.bird.maxLives,
      storedShields: this.bird.storedShields,
      storedHeals: this.bird.storedHeals,
      shields: this.bird.shields
    };
  }

  saveCheckpoint(round = this.currentRound) {
    const birdData = this.getBirdSaveData();
    if (!birdData) return;

    const safeRound = Phaser.Math.Clamp(Math.floor(round || 1), 1, 7);
    const updatedRun = SaveService.saveCheckpoint({
      slotId: this.saveSlotId,
      currentPhase: 2,
      currentRound: safeRound,
      birdData
    });
    if (updatedRun && Number.isFinite(updatedRun.slotId)) {
      this.saveSlotId = updatedRun.slotId;
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
    this.load.audio('bgm_rex_infernum', 'assets/soundtrack/Rex_Infernum.mp3');
    this.load.audio('bgm_boss_die_credits', 'assets/soundtrack/boss_die_credits.mp3');
    this.load.audio('bgm_pause', 'assets/soundtrack/pause.mp3');
    this.preloadSfxAssets();
  }

  preloadSfxAssets() {
    const sfxEntries = [
      ['bee_die', 'assets/Audio/bee_die.mp3'],
      ['boss_die', 'assets/Audio/boss_die.mp3'],
      ['boss_swing_attack', 'assets/Audio/boss_swing_attack.mp3'],
      ['boss_teleport_attack', 'assets/Audio/boss_teleport_attack.mp3'],
      ['fairy_attack', 'assets/Audio/fairy_attack.mp3'],
      ['fairy_die', 'assets/Audio/fairy_die.mp3'],
      ['flicker_die', 'assets/Audio/flicker_die.mp3'],
      ['mushroom_die', 'assets/Audio/mushroom_die.mp3'],
      ['orange_die', 'assets/Audio/orange_die.mp3'],
      ['blue_red_coin', 'assets/Audio/blue_red_coin.ogg'],
      ['gold_coin', 'assets/Audio/gold_coin.mp3'],
      ['shield', 'assets/Audio/shield.ogg'],
      ['healing', 'assets/Audio/healing.mp3'],
      ['level_up', 'assets/Audio/level_up.mp3'],
      ['round_clear', 'assets/Audio/round_clear.mp3'],
      ['dash', 'assets/Audio/dash.mp3'],
      ['food', 'assets/Audio/food.mp3'],
      ['explosion', 'assets/Audio/explosão.ogg']
    ];

    for (let i = 1; i <= 10; i++) {
      sfxEntries.push([`coco_monstro${i}`, `assets/Audio/coco_monstro${i}.ogg`]);
    }

    sfxEntries.forEach(([key, path]) => {
      if (!this.cache.audio.exists(key)) {
        this.load.audio(key, path);
      }
    });
  }

  playSfx(key, options = {}) {
    if (!key || !this.cache.audio.exists(key)) return;

    const baseVolume = options.volume ?? 1;
    const finalVolume = Phaser.Math.Clamp(baseVolume * this.sfxMasterVolume, 0, 1);
    this.sound.play(key, { ...options, volume: finalVolume });
  }

  playRandomCocoMonstro(options = {}) {
    const index = Phaser.Math.Between(1, 10);
    this.playSfx(`coco_monstro${index}`, options);
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
    Poop.createAnimations(this);
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

    this.currentRound = (this.continueData && this.continueData.currentPhase === 2)
      ? Phaser.Math.Clamp(Math.floor(this.continueData.currentRound || 1), 1, 7)
      : 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;

    // SETUP DE CONTROLES: Usa o perfil de controle salvo em SettingsService
    const controlScheme = SettingsService.getControlScheme();
    const inputBindings = InputProfileService.createInputBindings(this, controlScheme);
    this.bird.setControlBindings(inputBindings);

    // Setup de teclas de debug (fora do perfil de jogador)
    this.cursors = inputBindings.cursors;  // Guarda para referência da cena se necessário
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

    

    const poopEnemyGroups = [...birdEnemyGroups];
    poopEnemyGroups.forEach(group => {
      this.physics.add.overlap(this.poops, group, (poop, enemy) => this.handlePoopHit(poop, enemy));
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
    
    // Carrega volume master das configurações
    const masterVolume = SettingsService.getMasterVolume() / 100; // Normaliza de 0-100 para 0-1
    this.sfxMasterVolume = masterVolume;
    this.sound.volume = masterVolume;
    
    this.bgmPhase2 = this.sound.add('bgm_phase2', { loop: true, volume: 0 });
    this.bgmRexInfernum = this.sound.add('bgm_rex_infernum', { loop: true, volume: 0 });
    this.bgmBossDieCredits = this.sound.add('bgm_boss_die_credits', { loop: true, volume: 0 });
    this.bgmPause = this.sound.add('bgm_pause', { loop: true, volume: 0.3 });

    this.transitionToMusic(this.bgmPhase2, 0.4, 2000);
  }

  transitionToMusic(nextTrack, targetVolume = 0.4, duration = 2000) {
    if (!nextTrack) return;

    const allTracks = [this.bgmPhase2, this.bgmRexInfernum, this.bgmBossDieCredits].filter(Boolean);

    allTracks.forEach((track) => {
      if (track === nextTrack) return;
      if (track.isPlaying && track.volume > 0) {
        this.tweens.add({
          targets: track,
          volume: 0,
          duration,
          onComplete: () => {
            if (track.isPlaying) track.stop();
          }
        });
      }
    });

    if (!nextTrack.isPlaying) {
      nextTrack.setVolume(0);
      nextTrack.play();
    }

    this.tweens.add({
      targets: nextTrack,
      volume: targetVolume,
      duration
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
                if (this.isGameStarted && !this.isGameOver && !this.isPaused && !this.isBossTransitioning && !this.isBossFightActive) {
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
    this.playSfx('round_clear', { volume: 0.95 });
    if (this.currentRound === 4) {
      this.coins.add(new BlueCoin(this, 2120, 540));
    }

    this.time.delayedCall(2200, () => {
      const nextRound = this.currentRound + 1;
      if (nextRound <= 6) this.saveCheckpoint(nextRound);
      else this.saveCheckpoint(7);

      this.currentRound = nextRound;
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
    this.saveCheckpoint(7);
    this.updateRoundHUD();
    
    this.bird.isControlLocked = true;
    this.bird.setFlipX(false); 

    if (this.bird.body) {
        this.bird.body.setVelocity(0, 0); 
        this.bird.body.setAllowGravity(false); 
    }
    
    const groupsToClear = [this.fruits, this.oranges, this.fairies, this.mushrooms, this.bees, this.flickers, this.enemyProjectiles, this.poops];
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
            this.beginBossFight();
            
            this.physics.add.overlap(this.bird, this.boss, (bird, boss) => {
              if (bird.isDead || boss.isDead) return;

              if (bird.isDashing) {
                if (bird.dashHitEnemies && bird.dashHitEnemies.has(boss)) return;
                if (bird.dashHitEnemies) bird.dashHitEnemies.add(boss);

                boss.takeDamage(bird.dashDamage || 1);
                return;
              }

              if (boss.anims.currentAnim && (boss.anims.currentAnim.key === 'boss_spin' || boss.anims.currentAnim.key === 'boss_dash_attack')) {
                bird.takeDamage();
                }
            });

            this.physics.add.overlap(this.poops, this.boss, (poop, boss) => {
              this.handlePoopHitBoss(poop, boss);
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
    this.beginBossFight();
    this.physics.add.overlap(this.bird, this.boss, (bird, boss) => {
      if (bird.isDead || boss.isDead) return;

      if (bird.isDashing) {
        if (bird.dashHitEnemies && bird.dashHitEnemies.has(boss)) return;
        if (bird.dashHitEnemies) bird.dashHitEnemies.add(boss);

        boss.takeDamage(bird.dashDamage || 1);
        return;
      }

      if (boss.anims.currentAnim && (boss.anims.currentAnim.key === 'boss_spin' || boss.anims.currentAnim.key === 'boss_dash_attack')) {
        bird.takeDamage();
        }
    });
    this.physics.add.overlap(this.poops, this.boss, (poop, boss) => {
        this.handlePoopHitBoss(poop, boss);
    });
  }

  handlePoopHitBoss(poop, boss) {
    if (!poop || !boss || !poop.active || !boss.active || boss.isDead) return;

    const projectileDamage = poop.damage || 1;

    // A explosao pode encostar multiplas vezes no mesmo alvo; garante dano unico por explosao.
    if (poop.isExploding) {
      if (poop.hitEnemies && poop.hitEnemies.has(boss)) return;
      if (poop.hitEnemies) poop.hitEnemies.add(boss);
      boss.takeDamage(projectileDamage);
      this.playRandomCocoMonstro({ volume: 0.7 });
      return;
    }

    // Impacto direto: boss absorve o dano total e o projetil some.
    boss.takeDamage(projectileDamage);
    this.playRandomCocoMonstro({ volume: 0.7 });
    poop.destroy();
  }

  handlePoopHit(poop, enemy) {
    if (enemy.isDead || !enemy.active) return;

    // Se for uma explosao, garante que so da dano UMA VEZ em cada inimigo.
    if (poop.isExploding) {
      if (poop.hitEnemies && poop.hitEnemies.has(enemy)) return;
      if (poop.hitEnemies) poop.hitEnemies.add(enemy);
    }

    const enemyCurrentHP = enemy.hp || 1;

    if (typeof enemy.takeDamage === 'function') {
      enemy.takeDamage(poop.damage);
      this.playRandomCocoMonstro({ volume: 0.7 });
    } else if (typeof enemy.die === 'function') {
      enemy.die();
      this.playRandomCocoMonstro({ volume: 0.7 });
    }

    // Regra de penetracao e destruicao (apenas para o projetil em voo).
    if (!poop.isExploding) {
      if (poop.damage > enemyCurrentHP) {
        poop.damage -= enemyCurrentHP;
        if (poop.auraFX) {
          poop.auraFX.outerStrength = Math.max(poop.auraFX.outerStrength - 1, 0);
        }
      } else {
        // Absorvido: some sem explodir.
        poop.destroy();
      }
    }
  }

  beginBossFight() {
    this.isBossFightActive = true;
    this.updateRoundHUD();

    this.events.once('bossIntroComplete', () => {
      this.startBossFightFruits();
    });

    this.events.once('bossDefeated', () => {
      this.stopBossFightFruits();
      this.brightenBackground();
      this.transitionToMusic(this.bgmBossDieCredits, 0.45, 3500);

      if (this.bird) {
        this.bird.isInvulnerable = true;
        this.bird.isControlLocked = true;
      }
    });

    this.events.once('bossDeathSequenceComplete', () => {
      this.showVictorySequence();
    });

    if (this.bossFruitTimer) {
      this.bossFruitTimer.remove(false);
      this.bossFruitTimer = null;
    }

    if (this.fruits) {
      this.fruits.getChildren().forEach((fruit) => {
        if (fruit && fruit.active) fruit.destroy();
      });
    }

    this.transitionToMusic(this.bgmRexInfernum, 0.45, 2500);

  }

  startBossFightFruits() {
    if (!this.isBossFightActive || this.isPaused || this.isGameOver || !this.boss || this.boss.isDead) return;

    if (this.bossFruitTimer) {
      this.bossFruitTimer.remove(false);
      this.bossFruitTimer = null;
    }

    this.bossFruitTimer = this.time.addEvent({
      delay: 4500,
      loop: true,
      callback: () => {
        if (!this.isBossFightActive || this.isPaused || this.isGameOver || !this.boss || this.boss.isDead) return;
        this.spawnBossDecorationFruit();
      }
    });
  }

  stopBossFightFruits() {
    this.isBossFightActive = false;

    if (this.bossFruitTimer) {
      this.bossFruitTimer.remove(false);
      this.bossFruitTimer = null;
    }

    if (this.fruits) {
      this.fruits.getChildren().forEach((fruit) => {
        if (fruit && fruit.active && fruit.isStaticDecoration) fruit.destroy();
      });
    }
  }

  spawnBossDecorationFruit() {
    const w = this.scale.width;
    const treeTopY = 300;
    const treeBottomY = 600;
    const leftTreeX = 120;
    const rightTreeX = w - 120;

    const fruitType = Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']);
    const spawnX = Phaser.Math.Between(leftTreeX, rightTreeX);
    const spawnY = Phaser.Math.Between(treeTopY, treeBottomY);
    this.fruits.add(new Fruit(this, spawnX, spawnY, fruitType, true));
  }

  brightenBackground() {
    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 4000,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0x7755aa),
          Phaser.Display.Color.ValueToColor(0xffffff),
          100,
          value
        );

        const color = Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b);
        this.bgLayers.forEach((layer) => {
          if (layer.sprite.blendMode !== Phaser.BlendModes.ADD) {
            layer.sprite.setTint(color);
          }
        });
      }
    });
  }

  showVictorySequence() {
    const w = this.scale.width;
    const h = this.scale.height;

    const victoryText = this.add.text(w / 2, h / 2 - 50, 'O VAZIO FOI PURIFICADO', {
      fontSize: '72px',
      fontFamily: 'KenneyRocket',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5).setDepth(1500).setAlpha(0);

    this.tweens.add({
      targets: victoryText,
      alpha: 1,
      y: h / 2 - 80,
      duration: 9000,
      ease: 'Power2',
      onComplete: () => {
        this.time.delayedCall(13500, () => {
          this.cameras.main.fadeOut(1500, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.saveCheckpoint(7);
            this.scene.start('CreditsScene');
          });
        });
      }
    });

    if (this.bird && this.bird.body) {
      this.bird.isControlLocked = false;
      this.bird.body.setAllowGravity(true);
    }
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
        this.sound.stopAll();
        this.sound.play('sfx_game_over', { loop: false });
        this.setLowHealthBorderActive(false);

        this.gameOverGroup.setVisible(true);
        this.tweens.add({
          targets: this.gameOverOverlay,
          alpha: 0.8,
          duration: 1000
        });
        this.tweens.add({
          targets: [this.gameOverText, this.gameOverHomeBtn],
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

    if (!this.lowHealthBorder) {
      const w = this.scale.width;
      const h = this.scale.height;
      this.lowHealthBorder = this.add.rectangle(w / 2, h / 2, w - 10, h - 10)
        .setStrokeStyle(12, 0xff0000, 1)
        .setDepth(1200)
        .setScrollFactor(0)
        .setAlpha(0);
    }
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
    this.setLowHealthBorderActive(lives <= 1 && shields <= 0);
  }

  setLowHealthBorderActive(isActive) {
    if (!this.lowHealthBorder) return;

    const shouldPulse = isActive && !this.isGameOver;

    if (shouldPulse) {
      if (!this.lowHealthTween) {
        this.lowHealthBorder.setAlpha(0.12);
        this.lowHealthTween = this.tweens.add({
          targets: this.lowHealthBorder,
          alpha: 0.7,
          duration: 550,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      return;
    }

    if (this.lowHealthTween) {
      this.lowHealthTween.stop();
      this.lowHealthTween = null;
    }
    this.lowHealthBorder.setAlpha(0);
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
    if (this.levelText) this.levelText.setText(data.level >= 10 ? 'LEVEL MAX' : ('LEVEL ' + data.level));
    this.drawXPBar(data.level >= 10 ? 1 : (data.xp / data.xpNextLevel));
  }

  updateRoundHUD() {
    if (this.isBossTransitioning || this.isBossFightActive || this.currentRound > 6) {
      this.roundBarFill.clear();
      this.roundBarFill.fillStyle(0xff3333, 0.9);

      const { x, y, w, h } = this.roundBarData;
      this.roundBarFill.fillRoundedRect(x, y, w, h, 10);
      this.roundHeaderText.setText('BOSS FIGHT');
      return;
    }

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
    restartBtn.on('pointerdown', () => { this.restartCurrentRoundFromPause(); });
    homeBtn.on('pointerdown', () => { window.location.reload(); });
  }

  updatePauseStats() {
    if (!this.bird) return;
    const dashDmg = this.bird.getDashDamage();
    const poopDmg = this.bird.getShootDamage();
    const levelLabel = this.bird.level >= 10 ? 'MAX' : this.bird.level;

    // Obtém as teclas do perfil selecionado
    const controlScheme = SettingsService.getControlScheme();
    const displayKeys = InputProfileService.getDisplayKeysForProfile(controlScheme);

    const leftText = 
      `NÍVEL ATUAL: ${levelLabel}\n` +
        `PONTUAÇÃO: ${this.bird.score}\n` +
        `VIDAS: ${this.bird.lives} / ${this.bird.maxLives}\n\n` +
        `DANO DO DASH: ${dashDmg}\n` +
        `DANO DO COCO: ${poopDmg}\n` +
        `MUNIÇÃO: ${this.bird.ammo} / ${this.bird.maxAmmo}`;
    const rightText = 
        `[ ${displayKeys.moveLabel} ]  MOVER\n` +
        `[ ${displayKeys.dashKey} ]  DASH (Invencível)\n` +
        `[ ${displayKeys.shootKey} ]  ATIRAR\n\n\n` +
        `[ ${displayKeys.shieldKey} ]  USAR ESCUDO    x ${this.bird.storedShields}\n` +
        `[ ${displayKeys.healKey} ]  USAR CURA      x ${this.bird.storedHeals}`;

    this.statsTextLeft.setText(leftText);
    this.statsTextRight.setText(rightText);
  }

  createGameOverMenu(w, h) {
    this.gameOverGroup = this.add.group();
    this.gameOverOverlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.8).setOrigin(0).setDepth(300);
    this.gameOverText = this.add.text(w / 2, h / 2 - 80, 'GAME OVER', { fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#f00', stroke: '#000', strokeThickness: 10 }).setOrigin(0.5).setDepth(301);
    this.gameOverHomeBtn = this.add.text(w / 2, h / 2 + 120, 'MENU PRINCIPAL', { fontSize: '44px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#444', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(301);
    
    this.gameOverOverlay.setAlpha(0);
    this.gameOverText.setAlpha(0);
    this.gameOverHomeBtn.setAlpha(0);

    this.gameOverGroup.add(this.gameOverOverlay); 
    this.gameOverGroup.add(this.gameOverText); 
    this.gameOverGroup.add(this.gameOverHomeBtn);
    this.gameOverGroup.setVisible(false);

    this.gameOverHomeBtn.on('pointerdown', () => {
      window.location.reload();
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

  restartCurrentRoundFromPause() {
    const isBossRound = this.isBossFightActive || this.isBossTransitioning || this.currentRound > 6;
    const checkpointRound = isBossRound
      ? 7
      : Phaser.Math.Clamp(Math.floor(this.currentRound || 1), 1, 7);

    this.saveCheckpoint(checkpointRound);

    const run = this.resolveRunForPauseRestart();
    if (!run || !run.birdData) return;

    this.cleanupForRoundRestart();
    this.scene.start('Phase2Scene', { continueData: run, saveSlotId: run.slotId });
  }

  resolveRunForPauseRestart() {
    const slotFromContinue = this.continueData && Number.isFinite(this.continueData.slotId)
      ? Math.floor(this.continueData.slotId)
      : null;

    const bossRound = this.isBossFightActive || this.isBossTransitioning || this.currentRound > 6;
    const targetRound = bossRound
      ? 7
      : Phaser.Math.Clamp(Math.floor(this.currentRound || 1), 1, 7);

    let run = Number.isFinite(this.saveSlotId) ? SaveService.loadRun(this.saveSlotId) : null;
    if (!run && Number.isFinite(slotFromContinue)) {
      run = SaveService.loadRun(slotFromContinue);
    }

    if (!run) {
      const recentRuns = SaveService.loadRecentRuns(3);
      run = recentRuns.find((r) => r.currentPhase === 2) || null;
    }

    if (!run || !run.birdData) {
      const birdData = this.getBirdSaveData();
      if (!birdData) return null;

      const createdRun = SaveService.saveCheckpoint({
        slotId: Number.isFinite(this.saveSlotId) ? this.saveSlotId : slotFromContinue,
        currentPhase: 2,
        currentRound: targetRound,
        birdData
      });

      if (!createdRun || !createdRun.birdData) return null;
      if (Number.isFinite(createdRun.slotId)) this.saveSlotId = createdRun.slotId;

      return {
        ...createdRun,
        currentPhase: 2,
        currentRound: targetRound,
        slotId: createdRun.slotId
      };
    }

    const normalizedRun = {
      ...run,
      currentPhase: 2,
      currentRound: targetRound,
      slotId: run.slotId
    };

    SaveService.saveCheckpoint({
      slotId: normalizedRun.slotId,
      currentPhase: 2,
      currentRound: targetRound,
      birdData: normalizedRun.birdData
    });

    if (Number.isFinite(normalizedRun.slotId)) this.saveSlotId = normalizedRun.slotId;
    return normalizedRun;
  }

  cleanupForRoundRestart() {
    this.isPaused = false;
    this.isGameOver = false;
    this.isRoundTransitioning = false;
    this.isSpawningFinished = true;
    this.isBossTransitioning = false;
    this.isBossFightActive = false;
    this.isBossSpawned = false;

    if (this.pauseGroup) this.pauseGroup.setVisible(false);

    this.physics.resume();
    this.anims.resumeAll();
    this.tweens.killAll();
    this.time.removeAllEvents();

    if (this.bossFruitTimer) {
      this.bossFruitTimer.remove(false);
      this.bossFruitTimer = null;
    }

    if (this.bgmPause) this.bgmPause.stop();
    if (this.bgmPhase2) this.bgmPhase2.stop();
    if (this.bgmRexInfernum) this.bgmRexInfernum.stop();
    if (this.bgmBossDieCredits) this.bgmBossDieCredits.stop();
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
        if (this.bgmRexInfernum) this.bgmRexInfernum.pause();
        if (this.bgmBossDieCredits) this.bgmBossDieCredits.pause();
        if (this.bgmPause) this.bgmPause.play();
    } else {
        this.physics.resume();
        this.anims.resumeAll(); 
        if (this.bgmPause) this.bgmPause.stop();
        if (this.bgmPhase2) this.bgmPhase2.resume(); 
        if (this.bgmRexInfernum) this.bgmRexInfernum.resume();
        if (this.bgmBossDieCredits) this.bgmBossDieCredits.resume();
    }
  }
}
