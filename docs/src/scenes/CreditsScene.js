/**
 * CreditsScene.js - Tela de Encerramento e Créditos
 */
export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
    this.bgLayers = [];
    this.crawlContainer = null;
    this.scrollSpeed = 1.0;
    this.isFinished = false;
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
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Efeito de fade in ao entrar nos créditos
    this.cameras.main.fadeIn(2000, 0, 0, 0);

    // Reutilizando o fundo parallax (em tom roxo para combinar com a fase 2)
    const addLayer = (key, speed) => {
      const texture = this.textures.get(key);
      const img = texture.getSourceImage();
      const imgHeight = (img && img.height) ? img.height : 512;
      const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
      const scale = h / imgHeight;
      sprite.setScale(scale).setTint(0x7755aa);
      sprite.width = w / scale;
      this.bgLayers.push({ sprite: sprite, speed: speed * 0.05 });
    };

    addLayer('ceu_sombrio', 0.02);
    addLayer('bg_cielo', 0.1);
    addLayer('bg_arvores_fundo', 0.2);
    addLayer('bg_arvores_densas', 0.5);
    addLayer('bg_arvores_medias', 0.7);
    addLayer('bg_arvores_finas', 1.0);
    addLayer('bg_arbustos', 1.2);
    addLayer('bg_grama_fundo', 1.5);
    addLayer('bg_chao', 2.0);

    this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0);

    // Conteúdo dos Créditos
    const creditsContent = 
      "OBRIGADO POR JOGAR!\n\n\n" +
      "--- EQUIPE ---\n\n" +
      "Idealização:\nGiovanni L.O.S. & Letícia M. Torres\n\n" +
      "Roteiro e Narrativa:\nLetícia M. Torres\n\n" +
      "Desenvolvimento:\nGiovanni L.O.S. & Gemini\n\n\n" +
      "--- ASSETS ---\n\n" +
      "Arte e Sprites:\nVários Autores (OpenGameArt)\n\n" +
      "SoundTracks:\nVários Autores\n\n\n" +
      "A aventura de Tori continua...";

    this.crawlContainer = this.add.container(w / 2, h + 100);

    const title = this.add.text(0, 0, "FIM DA JORNADA", {
      fontFamily: 'KenneyRocket',
      fontSize: '64px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5);

    const body = this.add.text(0, 150, creditsContent, {
      fontFamily: 'KenneyPixel',
      fontSize: '42px',
      fill: '#ffffff',
      align: 'center',
      lineSpacing: 15
    }).setOrigin(0.5, 0);

    this.crawlContainer.add([title, body]);

    // Tecla para reiniciar o jogo
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    
    this.add.text(w / 2, h - 30, "Pressione '1' para voltar ao menu", {
        fontFamily: 'KenneyPixel',
        fontSize: '24px',
        fill: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.5);
  }

  update() {
    this.bgLayers.forEach(layer => {
      layer.sprite.tilePositionX += layer.speed;
    });

    if (this.crawlContainer && !this.isFinished) {
      this.crawlContainer.y -= this.scrollSpeed;

      // Se o texto terminar de subir
      if (this.crawlContainer.y < -1200) {
        this.isFinished = true;
        this.time.delayedCall(3000, () => {
            this.cameras.main.fadeOut(2000, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('StoryScene');
            });
        });
      }
    }
  }
}
