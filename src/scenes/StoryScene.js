/**
 * StoryScene.js - Cena de Introdução do Jogo Tori-Tori
 * Estilo "Star Wars Crawl" com parallax contemplativo.
 */
export default class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StoryScene' });
    this.bgLayers = [];
    this.crawlContainer = null;
    this.scrollSpeed = 1.2; // Velocidade de subida do texto
    this.isTransitioning = false;
  }

  preload() {
    // Carregamento dos assets de fundo (os mesmos da PlayScene para consistência)
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
    this.isTransitioning = false;

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

      // Velocidade reduzida para efeito contemplativo (5% da original)
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

    // Overlay para escurecer o fundo e destacar o texto
    this.add.rectangle(0, 0, w, h, 0x000000, 0.45).setOrigin(0);

    // --- LETREIRO (THE CRAWL) ---
    const storyContent = 
      "A pacifica floresta de Tsukimori\nja nao existe mais...\n\n" +
      "Kage-kyo, uma criatura sombria e poderosa,\nabriu uma fenda,\n" +
      "distorcendo nosso lar em uma\nescuridao irreconhecivel.\n\n" +
      "Seus monstros\nespreitam em cada sombra.\n\n" +
      "Mas a esperanca ainda voa.\n" +
      "Tori, lute pela nossa terra!";

    this.crawlContainer = this.add.container(w / 2, h + 50);

    const title = this.add.text(0, 0, "TORI-TORI", {
      fontFamily: 'KenneyRocket',
      fontSize: '72px',
      fill: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 10
    }).setOrigin(0.5);

    const body = this.add.text(0, 160, storyContent, {
      fontFamily: 'KenneyPixel',
      fontSize: '48px',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 18,
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5, 0);

    this.crawlContainer.add([title, body]);

    // --- TEXTO DE PULO ---
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

    // --- ENTRADA DE USUÁRIO ---
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.input.keyboard.on('keydown-SPACE', () => this.startPlayScene());
    this.input.on('pointerdown', () => this.startPlayScene());
  }

  update() {
    // Gatilho para testes
    if (this.key1 && Phaser.Input.Keyboard.JustDown(this.key1)) {
        this.startPlayScene();
    }
    // Movimento Parallax
    this.bgLayers.forEach(layer => {
      layer.sprite.tilePositionX += layer.speed;
    });

    // Subida do texto
    if (this.crawlContainer && !this.isTransitioning) {
      this.crawlContainer.y -= this.scrollSpeed;

      // Se o topo do container sumir totalmente no topo
      // (considerando a altura do container de aproximadamente 1000px)
      if (this.crawlContainer.y < -1100) {
        this.startPlayScene();
      }
    }
  }

  startPlayScene() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.cameras.main.fadeOut(1500, 0, 0, 0);

    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('PlayScene');
    });
  }
}
