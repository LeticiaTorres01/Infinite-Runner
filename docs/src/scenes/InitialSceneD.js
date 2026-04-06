/**
 * InitialSceneD.js - Cena de Introdução e Menu Principal do Jogo Tori-Tori
 */
export default class InitialSceneD extends Phaser.Scene {
  constructor() {
    super({ key: 'InitialSceneD' });
    this.bgLayers = [];
    this.crawlContainer = null;
    this.scrollSpeed = 0.9; 
    this.isTransitioning = false;
  }

  preload() {
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
    
    // Música do Menu
    this.load.audio('bgm_story', 'assets/soundtrack/story.mp3');
    this.load.audio('bgm_pre_start', 'assets/soundtrack/pre-start.mp3');
    this.load.audio('bgm_pause', 'assets/soundtrack/pause.mp3');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.isTransitioning = false;

    // Toca música da história
    this.bgmStory = this.sound.add('bgm_story', { loop: true, volume: 0.5 });
    this.bgmStory.play();

    // --- LÓGICA DE PARALLAX ---
    const addLayer = (key, speed, isLight = false) => {
      const texture = this.textures.get(key);
      const img = texture ? texture.getSourceImage() : null;
      const imgHeight = (img && img.height) ? img.height : 512;
      const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
      const scale = h / imgHeight;
      sprite.setScale(scale);
      sprite.width = w / scale;
      if (isLight) {
        sprite.setBlendMode(Phaser.BlendModes.ADD);
        sprite.setAlpha(0.3);
      }
      this.bgLayers.push({ sprite: sprite, speed: speed * 0.05 });
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

    this.overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.45).setOrigin(0);

    // --- LETREIRO ---
    const storyContent = 
      "A paz de Tsukimori foi estraçalhada.\n" +
      "Kage-kyō, um lorde de outra dimensão,\n" +
      "invadiu nosso mundo, transformando a\n" +
      "floresta em um campo de batalha\n" +
      "sombrio e distorcido.\n\n" +
      "Seus exércitos de monstros\n" +
      "estão por toda parte, e o\n" +
      "ambiente ao redor é hostil.\n\n" +
      "Você é Tori, um herói improvável\n" +
      "armado apenas com coragem e velocidade.\n" +
      "Sua missão é clara:\n" +
      "voar através do inferno em que\n" +
      "sua casa se tornou, desviar de\n" +
      "ameaças, eliminar os monstros\n e alcançar o\n" +
      "epicentro da invasão para\n" +
      "derrotar o tirano.\n\n" +
      "O destino de Tsukimori\n" +
      "depende das suas asas.";

    this.crawlContainer = this.add.container(w / 2, h + 50);
    this.storyBody = this.add.text(0, 0, storyContent, {
      fontFamily: 'KenneyPixel',
      fontSize: '64px',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 18,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 0);
    this.crawlContainer.add([this.storyBody]);

    this.skipText = this.add.text(w - 30, h - 30, "[PRESSIONE ESPAÇO PARA PULAR]", {
      fontFamily: 'KenneyPixel',
      fontSize: '28px',
      fill: '#ffffff',
      alpha: 0.8
    }).setOrigin(1);

    this.tweens.add({
      targets: this.skipText,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.on('keydown-SPACE', () => this.finishStory());
    this.input.on('pointerdown', () => this.finishStory());
  }

  update() {
    this.bgLayers.forEach(layer => {
      layer.sprite.tilePositionX += layer.speed;
    });

    if (this.crawlContainer && !this.isTransitioning) {
      this.crawlContainer.y -= this.scrollSpeed;
      if (this.crawlContainer.y < -1100) {
        this.finishStory();
      }
    }
  }

  finishStory() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.tweens.add({
        targets: [this.crawlContainer, this.skipText],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            this.showMainMenu();
        }
    });
  }

  showMainMenu() {
    const w = this.scale.width;
    const h = this.scale.height;

    if (this.bgmStory) this.bgmStory.stop(); 
    this.bgmMenu = this.sound.add('bgm_pre_start', { loop: true, volume: 0.5 });
    this.bgmMenu.play();

    this.menuGroup = this.add.group();

    const title = this.add.text(w / 2, h / 2 - 150, 'TORI-TORI', { 
        fontSize: '150px', fontFamily: 'KenneyRocket', fill: '#fff', stroke: '#000', strokeThickness: 15 
    }).setOrigin(0.5).setAlpha(0);

    const startBtn = this.add.text(w / 2, h / 2 + 100, ' START GAME ', { 
        fontSize: '80px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#2d5a27', padding: {x: 30, y: 15} 
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

    this.menuGroup.addMultiple([title, startBtn]);

    this.tweens.add({
        targets: [title, startBtn],
        alpha: 1,
        duration: 1500,
        ease: 'Power2'
    });

    startBtn.on('pointerdown', () => {
        this.sound.play('bgm_pause', { volume: 0.5 }); // Som de clique (reusando pause)
        this.tweens.add({
            targets: [title, startBtn],
            alpha: 0,
            duration: 500,
            onComplete: () => {
                this.cameras.main.fadeOut(1000, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.start('Phase1Scene');
                });
            }
        });
    });
  }
}
