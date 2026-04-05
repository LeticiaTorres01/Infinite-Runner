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
    this.roundRecipes = [
      { round: 1, oranges: 6, fairies: 0, mushrooms: 0, bees: 0, fruits: 3, coins: 2, spawnDelay: 2600 },
      { round: 2, oranges: 0, fairies: 2, mushrooms: 0, bees: 0, fruits: 3, coins: 2, spawnDelay: 2400 },
      { round: 3, oranges: 0, fairies: 0, mushrooms: 1, bees: 1, flickers: 1, fruits: 4, coins: 3, spawnDelay: 2100 },
      { round: 4, oranges: 4, fairies: 4, mushrooms: 5, bees: 5, fruits: 4, coins: 4, spawnDelay: 1800 },
      { round: 5, oranges: 6, fairies: 6, mushrooms: 6, bees: 6, fruits: 5, coins: 5, spawnDelay: 1500 }
    ];
    this.onFairyShoot = null;
    this.debugKey = null;
    this.xpDebugKey = null;
    this.muteKey = null;
    this.hearts = [];
    this.shieldIcons = [];
    this.birdData = null; // Armazena os dados vindos da Fase 1
  }

  init(data) {
    // Captura os dados do Tori se existirem
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

    const groundHeight = 60;
    this.ground = this.add.rectangle(-2000, h - groundHeight, w + 4000, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    this.bird = new Bird(this, -200, h / 2); // Comeca fora para o intro
    this.bird.setDepth(50);
    if (this.bird.body) this.bird.body.enable = false; 

    // APLICA OS DADOS DA FASE 1 (Se houver)
    if (this.birdData) {
        this.bird.level = this.birdData.level;
        this.bird.xp = this.birdData.xp;
        this.bird.score = this.birdData.score;
        this.bird.ammo = this.birdData.ammo;
        this.bird.lives = this.birdData.lives;
        this.bird.maxLives = this.birdData.maxLives;
        this.bird.storedShields = this.birdData.storedShields;
        this.bird.shields = this.birdData.shields;

        if (this.bird.shields > 0) {
            this.bird.shieldSprite.setVisible(true);
            this.bird.shieldSprite.play('shield_anim');
        }
    }

    this.mushrooms = this.add.group();
    this.bees = this.add.group();
    this.flickers = this.add.group();
    this.coins = this.add.group();
    this.goldCoins = this.add.group();
    this.fruits = this.add.group();
    this.poops = this.add.group();

    // Expandir os limites do mundo físico drasticamente para evitar qualquer teletransporte/limite
    this.physics.world.setBounds(-2000, -2000, w + 4000, h + 4000);

    // NOVOS GRUPOS DA FASE 2
    this.oranges = this.add.group();
    this.fairies = this.add.group();
    this.enemyProjectiles = this.add.group();

    this.physics.add.collider(this.oranges, this.ground);
    this.physics.add.collider(this.mushrooms, this.ground); // Já garante para todos do grupo

    // Captura os tiros disparados pelas Fadas
    this.onFairyShoot = (proj) => {
      if (proj && proj.active) this.enemyProjectiles.add(proj);
    };
    this.events.on('fairyShoot', this.onFairyShoot);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off('fairyShoot', this.onFairyShoot);
    });

    // VARIÁVEIS DE CONTROLE DE ROUND
    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false;
    this.isRoundTransitioning = false;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
    this.xpDebugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.L);
    this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

    this.createHeartsHUD();
    this.createAmmoHUD();
    this.createShieldInventoryHUD();
    this.createProgressionHUD();

    // EVENTOS DO HUD
    this.events.on('updateLives', (data) => this.updateHeartsHUD(data));
    this.events.on('updateAmmo', (ammo) => this.updateAmmoHUD(ammo));
    this.events.on('updateStoredShields', (count) => this.updateShieldInventoryHUD(count));
    this.events.on('updateProgress', (data) => this.updateProgressionHUD(data));
    this.events.on('updateMaxLives', (maxLives) => this.rebuildHeartsHUD(maxLives));

    this.physics.add.collider(this.bird, this.ground, () => {
      if (!this.bird.isDead) this.bird.takeDamage();
    });

    // SISTEMA DE DANO DO PÁSSARO E INIMIGOS
    const handleEnemyCollision = (bird, enemy) => {
        if (enemy.isDead || bird.isDead) return;
        if (bird.isDashing) {
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

    // SISTEMA DE TIRO (COCÔ) VS INIMIGOS
    const handlePoopHit = (poop, enemy) => {
      if (!poop.active || !enemy.active || enemy.isDead) return;

      // Se for uma explosão, garante que só dá dano UMA VEZ em cada inimigo
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

      // Regra de Penetração e Destruição (Apenas para o projétil em voo)
      if (!poop.isExploding) {
        if (projectileDamage > enemyCurrentHP) {
          // Atravessa o inimigo
          poop.damage = projectileDamage - enemyCurrentHP;
          if (poop.auraFX) {
              poop.auraFX.outerStrength = Math.max(poop.auraFX.outerStrength - 1, 0);
          }
        } else {
          // Absorvido: some sem explodir
          poop.destroy();
        }
      }
    };

    const poopEnemyGroups = [...birdEnemyGroups, this.enemyProjectiles];
    poopEnemyGroups.forEach(group => {
      this.physics.add.overlap(this.poops, group, handlePoopHit);
    });

    // Explosao ao tocar o chao, mantendo padrao da fase 1.
    this.physics.add.collider(this.poops, this.ground, (poop) => {
      if (poop && poop.active && !poop.isExploding) poop.explode();
    });

    // TIRO DA FADA VS PÁSSARO
    this.physics.add.overlap(this.bird, this.enemyProjectiles, (bird, proj) => {
      if (!bird.isDead && !bird.isDashing && !bird.isInvincible) {
        bird.takeDamage();
      }
      if (proj && proj.active) proj.destroy();
    });

    this.physics.add.overlap(this.bird, this.coins, (bird, coin) => {
      if (!bird.isDead && !coin.isCollected) {
        coin.collect();
        bird.collectShieldItem();
        bird.gainExperience(5, 50);
      }
    });
    this.physics.add.overlap(this.bird, this.goldCoins, (bird, coin) => {
      if (!bird.isDead && !coin.isCollected) coin.collect(bird);
    });
    this.physics.add.overlap(this.bird, this.fruits, (bird, fruit) => {
      if (!bird.isDead && !fruit.isCollected) fruit.collect(bird);
    });

    this.createPauseMenu(w, h);
    this.createGameOverMenu(w, h);

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Tori e HUD começam totalmente invisíveis
    this.bird.setVisible(false);
    this.setHUDAlpha(0);
    
    // Inicia a transição automaticamente (sem botão de teste)
    this.startCinematicIntro();

    // Fallback: caso a intro/tween não finalize por algum motivo, a fase começa mesmo assim.
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
    
    // 1. Garante posição inicial fora da tela e visibilidade
    this.bird.setPosition(-200, h / 2);
    this.bird.setVisible(true);
    if (this.bird.body) this.bird.body.enable = true;
    
    // 2. Voo suave para dentro do mapa
    this.tweens.add({
        targets: this.bird,
      x: 300,
        duration: 3000,
        ease: 'Power2.easeOut',
        onComplete: () => {
            this.isGameStarted = true;
            this.bird.setCollideWorldBounds(true);
          this.startRound();

            this.tweens.add({
                targets: [
                    ...this.hearts, ...this.shieldIcons,
                    this.ammoIcon, this.ammoText, 
                    this.shieldInvIcon, this.shieldInvText,
                    this.scoreText, this.levelText, 
                    this.xpBarBgGraphics, this.xpBarGraphics
                ],
                alpha: 1,
                duration: 1500,
                ease: 'Linear'
            });
        }
    });
  }

  spawnMonsters(time, delta) {
    // Mantido por compatibilidade, o motor principal usa spawn em fila (padrao da Fase 1).
    if (!this.isGameStarted || this.isPaused || this.isGameOver || this.isBossSpawned) return;
    if (!this.isSpawningFinished && this.spawnQueue.length === 0) this.isSpawningFinished = true;
  }

  startRound() {
    if (this.isGameOver || this.isBossSpawned) return;
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
    this.spawnQueue = [];

    for (let i = 0; i < (recipe.oranges || 0); i++) this.spawnQueue.push('orange');
    for (let i = 0; i < (recipe.fairies || 0); i++) this.spawnQueue.push('fairy');
    for (let i = 0; i < (recipe.mushrooms || 0); i++) this.spawnQueue.push('mushroom');
    for (let i = 0; i < (recipe.bees || 0); i++) this.spawnQueue.push('bee');
    for (let i = 0; i < (recipe.flickers || 0); i++) this.spawnQueue.push('flicker');
    for (let i = 0; i < (recipe.fruits || 0); i++) this.spawnQueue.push('fruit');
    for (let i = 0; i < (recipe.coins || 0); i++) this.spawnQueue.push('coin');
    Phaser.Utils.Array.Shuffle(this.spawnQueue);
    this.processSpawnQueue();
  }

  processSpawnQueue() {
    if (this.isGameOver || this.isPaused || this.isBossSpawned) return;
    if (this.spawnQueue.length === 0) {
      this.isSpawningFinished = true;
      return;
    }

    const type = this.spawnQueue.shift();
    const w = 1920;
    const h = 1080;

    switch (type) {
      case 'orange': {
        const spawnSide = Phaser.Math.Between(0, 1);
        const spawnX = spawnSide === 0 ? -500 : w + 500;
        const orange = new Orange(this, spawnX, h - 60); // Ajustado para o ground
        if (this.currentRound >= 3) orange.upgrade();
        this.oranges.add(orange);
        break;
      }
      case 'fairy': {
        const fairy = new Fairy(this, w + 200, Phaser.Math.Between(120, h - 280));
        if (this.currentRound >= 3) fairy.upgrade();
        this.fairies.add(fairy);
        break;
      }
      case 'mushroom': {
        const mushroom = new Mushroom(this, w + 100, h - 90);
        this.mushrooms.add(mushroom);
        this.physics.add.collider(mushroom, this.ground);
        
        mushroom.upgrade();
        if (this.currentRound >= 3) mushroom.ultimateUpgrade();
        break;
      }
      case 'bee': {
        const bee = new Bee(this, w + 200, Phaser.Math.Between(100, h - 320));
        this.bees.add(bee);
        
        bee.upgrade();
        if (this.currentRound >= 3) bee.ultimateUpgrade();
        break;
      }
      case 'flicker': {
        const flicker = new Flicker(this, w + 200, Phaser.Math.Between(100, h - 200));
        this.flickers.add(flicker);
        
        flicker.upgrade();
        if (this.currentRound >= 3) flicker.ultimateUpgrade();
        break;
      }
      case 'fruit': {
        const fruitType = Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']);
        this.fruits.add(new Fruit(this, w + 200, Phaser.Math.Between(300, 600), fruitType));
        break;
      }
      case 'coin': {
        this.goldCoins.add(new GoldCoin(this, w + 200, Phaser.Math.Between(220, h - 320)));
        break;
      }
      default:
        break;
    }

    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    const delay = recipe ? recipe.spawnDelay : 2000;
    this.time.delayedCall(delay, () => this.processSpawnQueue());
  }

  checkRoundEnd() {
    if (this.isRoundTransitioning || this.isBossSpawned) return;
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
      if (this.currentRound > this.roundRecipes.length) {
        this.startBossSequence();
      } else {
        this.startRound();
      }
    });
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

    if (this.muteKey && Phaser.Input.Keyboard.JustDown(this.muteKey)) {
      this.sound.mute = !this.sound.mute;
    }

    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
    if (this.isPaused) return;
    if (this.debugKey && Phaser.Input.Keyboard.JustDown(this.debugKey)) this.debugSkipRound();
    if (this.xpDebugKey && Phaser.Input.Keyboard.JustDown(this.xpDebugKey) && this.bird) this.bird.gainExperience(100, 0);

    if (this.bird && this.bird.isDead) {
      if (this.bird.y > this.scale.height + 50) { this.isGameOver = true; this.gameOverGroup.setVisible(true); }
      return;
    }

    this.bgLayers.forEach(layer => { 
        layer.sprite.tilePositionX += layer.speed * this.bgSpeedFactor; 
    });

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
      
      // NOVAS ENTIDADES
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
    const barW = 250; const barH = 30; const barX = w - 60 - barW; const barY = h - 25 - barH;
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
    if (this.isPaused) this.physics.pause(); else this.physics.resume();
  }
}
