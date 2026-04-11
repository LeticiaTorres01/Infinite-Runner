/**
 * InitialSceneD.js - Cena de Introdução e Menu Principal do Jogo Tori-Tori
 */
import SaveService from '../services/SaveService.js';
import { SettingsService } from '../services/SettingsService.js';
import { InputProfileService } from '../services/InputProfileService.js';

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
    this.load.audio('sfx_game_over', 'assets/soundtrack/game_over.ogg');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.isTransitioning = false;
    this.isStartingGame = false;

    // Toca música pre-start (conforme pedido, única para toda a apresentação)
    const baseMenuVolume = 0.5;
    const masterVolume = SettingsService.getMasterVolume() / 100;
    const musicVolume = SettingsService.getMusicVolume() / 100;
    const menuTargetVolume = baseMenuVolume * masterVolume * musicVolume;

    this.bgmMenu = this.sound.add('bgm_pre_start', { loop: true, volume: 0 });
    this.bgmMenu.play();
    this.tweens.add({ targets: this.bgmMenu, volume: menuTargetVolume, duration: 2000 });

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

    this.skipPulseTween = this.tweens.add({
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

    if (this.skipPulseTween) {
      this.skipPulseTween.stop();
      this.skipPulseTween = null;
    }
    if (this.skipText) {
      this.tweens.killTweensOf(this.skipText);
    }

    this.tweens.add({
        targets: [this.crawlContainer, this.skipText],
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            if (this.skipText) {
              this.skipText.destroy();
              this.skipText = null;
            }
            if (this.crawlContainer) {
              this.crawlContainer.destroy();
              this.crawlContainer = null;
            }
            this.showMainMenu();
        }
    });
  }

  showMainMenu() {
    const w = this.scale.width;
    const h = this.scale.height;

    // A música pre-start continua tocando, não paramos mais ela aqui
    this.menuGroup = this.add.group();

    const title = this.add.text(w / 2, h / 2 - 150, 'TORI-TORI', { 
        fontSize: '150px', fontFamily: 'KenneyRocket', fill: '#fff', stroke: '#000', strokeThickness: 15 
    }).setOrigin(0.5).setAlpha(0).setDepth(100);

    const runsBtn = this.add.text(w / 2, h / 2 + 100, ' PLAY ', {
      fontSize: '86px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#1e4a7a', padding: {x: 34, y: 16}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0).setDepth(100);

    const configBtn = this.add.text(w / 2, h / 2 + 220, ' CONFIGURAÇÕES ', {
      fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#4a4a4a', padding: {x: 24, y: 12}
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0).setDepth(100);

    this.menuGroup.addMultiple([title, runsBtn, configBtn]);

    this.isTransitioning = false;  // IMPORTANTE: Reseta flag de transição

    this.tweens.add({
      targets: [title, runsBtn, configBtn],
        alpha: 1,
        duration: 1500,
        ease: 'Power2'
    });

    runsBtn.on('pointerdown', () => {
      console.log('PLAY botão clicado');
      if (this.isTransitioning) return;
      this.openRunsModal([title, runsBtn, configBtn]);
    });

    configBtn.on('pointerdown', () => {
      console.log('CONFIGURAÇÕES botão clicado');
      if (this.isTransitioning) return;
      this.openSettingsModal([title, runsBtn, configBtn]);
    });
  }

  startFromMenu(targetScene, payload, hideTargets) {
    this.isStartingGame = true;
    this.tweens.add({ targets: this.bgmMenu, volume: 0, duration: 1500 });
    this.tweens.add({
      targets: hideTargets,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start(targetScene, payload);
        });
      }
    });
  }

  openRunsModal(mainMenuTargets) {
    const w = this.scale.width;
    const h = this.scale.height;
    const setMainMenuInteractivity = (enabled) => {
      if (!Array.isArray(mainMenuTargets)) return;
      mainMenuTargets.forEach((target) => {
        if (!target || !target.input) return;
        if (enabled) target.setInteractive({ useHandCursor: true });
        else target.disableInteractive();
      });
    };

    setMainMenuInteractivity(false);

    const baseBirdData = {
      level: 1,
      xp: 0,
      score: 0,
      ammo: 10,
      lives: 3,
      maxLives: 3,
      storedShields: 0,
      storedHeals: 0,
      shields: 0
    };
    const runsBySlot = [1, 2, 3].map((slotId) => ({ slotId, run: SaveService.loadRun(slotId) }));

    const modalGroup = this.add.group();
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.85)
      .setOrigin(0)
      .setDepth(2000)
      .setInteractive();
    overlay.on('pointerdown', (_pointer, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    const panel = this.add.rectangle(w / 2, h / 2, 1320, 760, 0x0d111a, 0.96).setDepth(2001).setStrokeStyle(4, 0x00aaff);
    const title = this.add.text(w / 2, h / 2 - 300, 'PLAY', {
      fontSize: '78px', fontFamily: 'KenneyRocket', fill: '#ffffff', stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(2002);

    modalGroup.addMultiple([overlay, panel, title]);

    runsBySlot.forEach(({ slotId, run }, index) => {
      const y = h / 2 - 165 + (index * 180);
      const line = this.add.rectangle(w / 2, y + 60, 1220, 1, 0x2d5a7a, 0.6).setDepth(2001);
      const label = run
        ? `SLOT ${slotId}  |  FASE ${run.currentPhase} ROUND ${run.currentRound}  |  SCORE ${run.birdData.score}`
        : `SLOT ${slotId}  |  VAZIO`;
      const slotText = this.add.text(w / 2 - 520, y, label, {
        fontSize: '36px', fontFamily: 'KenneyPixel', fill: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(2002);

      const playLabel = run ? ' JOGAR ' : ' NOVA RUN ';
      const playBtn = this.add.text(w / 2 + 250, y, playLabel, {
        fontSize: '34px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#1e4a7a', padding: { x: 16, y: 8 }
      }).setOrigin(0.5).setDepth(2002).setInteractive({ useHandCursor: true });

      playBtn.on('pointerdown', () => {
        if (this.isStartingGame) return;

        if (run) {
          modalGroup.clear(true, true);
          const targetScene = run.currentPhase === 2 ? 'Phase2Scene' : 'Phase1Scene';
          this.startFromMenu(targetScene, { continueData: run, saveSlotId: run.slotId }, mainMenuTargets);
          return;
        }

        const newRun = SaveService.createRunInSlot({
          slotId,
          currentPhase: 1,
          currentRound: 1,
          birdData: baseBirdData
        });
        if (!newRun) return;

        modalGroup.clear(true, true);
        this.startFromMenu('Phase1Scene', { saveSlotId: newRun.slotId }, mainMenuTargets);
      });

      modalGroup.addMultiple([line, slotText, playBtn]);

      if (run) {
        const deleteBtn = this.add.text(w / 2 + 470, y, ' EXCLUIR ', {
          fontSize: '34px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#8a2b2b', padding: { x: 16, y: 8 }
        }).setOrigin(0.5).setDepth(2002).setInteractive({ useHandCursor: true });

        deleteBtn.on('pointerdown', () => {
          if (this.isStartingGame) return;
          SaveService.clearRun(slotId);
          modalGroup.clear(true, true);
          this.openRunsModal(mainMenuTargets);
        });

        modalGroup.add(deleteBtn);
      }
    });

    const closeBtn = this.add.text(w / 2, h / 2 + 265, ' FECHAR ', {
      fontSize: '44px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#555', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(2002).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      if (this.isStartingGame) return;
      modalGroup.clear(true, true);
      setMainMenuInteractivity(true);
    });

    modalGroup.add(closeBtn);
  }

  openSettingsModal(mainMenuTargets) {
    const w = this.scale.width;
    const h = this.scale.height;
    const setMainMenuInteractivity = (enabled) => {
      if (!Array.isArray(mainMenuTargets)) return;
      mainMenuTargets.forEach((target) => {
        if (!target || !target.input) return;
        if (enabled) target.setInteractive({ useHandCursor: true });
        else target.disableInteractive();
      });
    };

    setMainMenuInteractivity(false);

    // Carrega configurações atuais
    const currentScheme = SettingsService.getControlScheme();
    const currentMasterVolume = SettingsService.getMasterVolume();
    const currentMusicVolume = SettingsService.getMusicVolume();
    const currentFxVolume = SettingsService.getFxVolume();

    // Grupo do modal
    const modalGroup = this.add.group();

    // Fundo semi-transparente (overlay)
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.85)
      .setOrigin(0)
      .setDepth(2000)
      .setInteractive();
    overlay.on('pointerdown', (_pointer, _lx, _ly, event) => {
      if (event) event.stopPropagation();
    });
    modalGroup.add(overlay);

    // Painel central (estilo consistente com PLAY modal, aumentado para 3 sliders)
    const panelWidth = 1100;
    const panelHeight = 850;
    const panel = this.add.rectangle(w / 2, h / 2, panelWidth, panelHeight, 0x0d111a, 0.96).setDepth(2001).setStrokeStyle(4, 0x00aaff);
    modalGroup.add(panel);

    // Título
    const title = this.add.text(w / 2, h / 2 - 280, 'CONFIGURAÇÕES', {
      fontSize: '70px', fontFamily: 'KenneyRocket', fill: '#ffffff', stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(2002);
    modalGroup.add(title);

    // --- SEÇÃO DE COMANDOS ---
    const cmdLabel = this.add.text(w / 2 - 450, h / 2 - 180, 'ESQUEMA DE CONTROLES', {
      fontSize: '38px', fontFamily: 'KenneyPixel', fill: '#ffff00', stroke: '#000', strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(2002);
    modalGroup.add(cmdLabel);

    // Linha divisória
    const line1 = this.add.rectangle(w / 2, h / 2 - 145, panelWidth - 100, 2, 0x00aaff, 0.6).setDepth(2001);
    modalGroup.add(line1);

    const profiles = [
      { name: 'arrows', label: 'Setinhas' },
      { name: 'wsad', label: 'WSAD' },
      { name: 'vim', label: 'Vim-like' }
    ];

    let selectedProfile = currentScheme;
    const profileButtons = [];

    profiles.forEach((profile, index) => {
      const xPos = w / 2 - 280 + index * 200;
      const isSelected = selectedProfile === profile.name;
      const btn = this.add.text(xPos, h / 2 - 90, ` ${profile.label} `, {
        fontSize: '36px', fontFamily: 'KenneyPixel', 
        fill: isSelected ? '#ffffff' : '#dce7f5',
        backgroundColor: isSelected ? '#3c5f8f' : '#2a3b55',
        stroke: isSelected ? '#89a9d6' : '#5e7ca3',
        strokeThickness: 2,
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setDepth(2002).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        // Atualiza seleção visual
        profileButtons.forEach(b => {
          b.setStyle({ fill: '#dce7f5', backgroundColor: '#2a3b55', stroke: '#5e7ca3', strokeThickness: 2 });
        });
        btn.setStyle({ fill: '#ffffff', backgroundColor: '#3c5f8f', stroke: '#89a9d6', strokeThickness: 2 });
        selectedProfile = profile.name;

        // Aplica imediatamente
        SettingsService.setControlScheme(selectedProfile);
      });

      profileButtons.push(btn);
      modalGroup.add(btn);
    });

    // --- SEÇÃO DE VOLUME ---
    const volLabel = this.add.text(w / 2 - 450, h / 2 + 20, 'VOLUMES', {
      fontSize: '38px', fontFamily: 'KenneyPixel', fill: '#ffff00', stroke: '#000', strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(2002);
    modalGroup.add(volLabel);

    // Linha divisória
    const line2 = this.add.rectangle(w / 2, h / 2 + 55, panelWidth - 100, 2, 0x00aaff, 0.6).setDepth(2001);
    modalGroup.add(line2);

    // Função helper para criar um slider de volume
    const createVolumeSlider = (yOffset, label, currentVolume, setter) => {
      // Label do slider
      const sliderLabel = this.add.text(w / 2 - 450, h / 2 + yOffset, label, {
        fontSize: '28px', fontFamily: 'KenneyPixel', fill: '#89a9d6', stroke: '#000', strokeThickness: 2
      }).setOrigin(0, 0.5).setDepth(2002);
      modalGroup.add(sliderLabel);

      // Display do volume
      const volumeDisplay = this.add.text(w / 2 + 380, h / 2 + yOffset, `${currentVolume.toFixed(0)}%`, {
        fontSize: '36px', fontFamily: 'KenneyPixel', fill: '#fff', 
        backgroundColor: '#1e4a7a', stroke: '#00aaff', strokeThickness: 2,
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setDepth(2002);
      modalGroup.add(volumeDisplay);

      // Slider
      const sliderX = w / 2 - 200;
      const sliderWidth = 300;
      const sliderY = h / 2 + yOffset;

      // Barra de fundo
      const sliderBg = this.add.rectangle(sliderX + sliderWidth / 2, sliderY, sliderWidth, 20, 0x333, 1).setOrigin(0.5).setDepth(2001).setStrokeStyle(2, 0x00aaff);
      modalGroup.add(sliderBg);

      // Barra de progresso
      const sliderFill = this.add.rectangle(sliderX + ((currentVolume / 100) * sliderWidth) / 2, sliderY, (currentVolume / 100) * sliderWidth, 20, 0x00ff00, 1).setOrigin(0.5, 0.5).setDepth(2001);
      modalGroup.add(sliderFill);

      const refreshVolumeBar = (volume) => {
        const normalizedVolume = Phaser.Math.Clamp(volume, 0, 100);
        const fillWidth = (normalizedVolume / 100) * sliderWidth;
        sliderFill.setDisplaySize(fillWidth, 20);
        sliderFill.setPosition(sliderX + fillWidth / 2, sliderY);
      };

      // Atualiza volume ao clicar na barra
      const updateVolume = (x) => {
        const relativeX = Phaser.Math.Clamp(x - sliderX, 0, sliderWidth);
        const newVol = (relativeX / sliderWidth) * 100;
        setter(newVol);
        volumeDisplay.setText(`${newVol.toFixed(0)}%`);
        refreshVolumeBar(newVol);
      };

      sliderBg.setInteractive();
      sliderBg.on('pointerdown', (pointer) => updateVolume(pointer.x));
      sliderBg.on('pointermove', (pointer) => {
        if (pointer.isDown) updateVolume(pointer.x);
      });

      // Botão - para volume
      const decBtn = this.add.text(sliderX - 60, sliderY, ' − ', {
        fontSize: '36px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#8a2b2b', 
        stroke: '#fff', strokeThickness: 2,
        padding: { x: 10, y: 4 }
      }).setOrigin(0.5).setDepth(2002).setInteractive({ useHandCursor: true });

      decBtn.on('pointerdown', () => {
        const currentVal = volumeDisplay.text.replace('%', '');
        const vol = Math.max(0, parseFloat(currentVal) - 5);
        setter(vol);
        volumeDisplay.setText(`${vol.toFixed(0)}%`);
        refreshVolumeBar(vol);
      });
      modalGroup.add(decBtn);

      // Botão + para volume
      const incBtn = this.add.text(sliderX + sliderWidth + 60, sliderY, ' + ', {
        fontSize: '36px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#2d5a27', 
        stroke: '#fff', strokeThickness: 2,
        padding: { x: 10, y: 4 }
      }).setOrigin(0.5).setDepth(2002).setInteractive({ useHandCursor: true });

      incBtn.on('pointerdown', () => {
        const currentVal = volumeDisplay.text.replace('%', '');
        const vol = Math.min(100, parseFloat(currentVal) + 5);
        setter(vol);
        volumeDisplay.setText(`${vol.toFixed(0)}%`);
        refreshVolumeBar(vol);
      });
      modalGroup.add(incBtn);
    };

    // Criar 3 sliders verticalmente stackados
    createVolumeSlider(100, 'Master:', currentMasterVolume, (vol) => {
      SettingsService.setMasterVolume(vol);
      // Também atualiza volume da música em tempo real
      if (this.bgmMenu && this.bgmMenu.isPlaying) {
        const baseMenuVolume = 0.5;
        const masterVol = vol / 100;
        const musicVol = SettingsService.getMusicVolume() / 100;
        const finalVol = baseMenuVolume * masterVol * musicVol;
        this.bgmMenu.setVolume(finalVol);
      }
    });

    createVolumeSlider(180, 'Música:', currentMusicVolume, (vol) => {
      SettingsService.setMusicVolume(vol);
      // Atualiza volume da música em tempo real (menu atual + cenas futuras)
      if (this.bgmMenu && this.bgmMenu.isPlaying) {
        const baseMenuVolume = 0.5;
        const masterVol = SettingsService.getMasterVolume() / 100;
        const musicVol = vol / 100;
        const finalVol = baseMenuVolume * masterVol * musicVol;
        this.bgmMenu.setVolume(finalVol);
      }
    });

    createVolumeSlider(260, 'Efeitos:', currentFxVolume, (vol) => {
      SettingsService.setFxVolume(vol);
      // Volume de efeitos será aplicado quando trocar de cena ou em tempo real via playSfx()
    });

    // Botão de fechar (OK)
    const closeBtn = this.add.text(w / 2, h / 2 + 350, ' OK ', {
      fontSize: '52px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#2d5a27', 
      stroke: '#000', strokeThickness: 4,
      padding: { x: 50, y: 15 }
    }).setOrigin(0.5).setDepth(2003).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      modalGroup.clear(true, true);
      setMainMenuInteractivity(true);
    });

    modalGroup.add(closeBtn);
  }
}
