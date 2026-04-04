export default class Poop extends Phaser.Physics.Arcade.Sprite {
  // ATENÇÃO: Nova assinatura recebendo o 'birdLevel'
  constructor(scene, x, y, velocityX, birdLevel = 1) {
    super(scene, x, y, 'poop');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.birdLevel = Math.min(birdLevel, 10); // Trava no level 10
    this.isExploding = false;
    this.setScale(1.5); // Escala inicial do projétil
    this.setOrigin(0.5, 1); // Âncora na base para não afundar no chão
    this.setDepth(15);

    // TABELA DE STATUS DO COCÔ (Level: {dmg, radius, row, glowStr, glowColor, expScale, aoeW, aoeH})
    // O Game Designer pode alterar livremente esses valores para balancear o jogo!
    this.poopConfig = {
        1: { dmg: 1, radius: 25, row: 1, glowStr: 1, glowColor: 0x8B4513, expScale: 1.5, aoeW: 0, aoeH: 0 }, 
        2: { dmg: 2, radius: 30, row: 2, glowStr: 1, glowColor: 0xA0522D, expScale: 2.0, aoeW: 60, aoeH: 30 }, 
        3: { dmg: 3, radius: 35, row: 3, glowStr: 2, glowColor: 0xCD853F, expScale: 2.5, aoeW: 80, aoeH: 40 },
        4: { dmg: 3, radius: 40, row: 4, glowStr: 2, glowColor: 0xCD853F, expScale: 2.5, aoeW: 100, aoeH: 50 },
        5: { dmg: 4, radius: 45, row: 5, glowStr: 3, glowColor: 0xD2691E, expScale: 3.0, aoeW: 120, aoeH: 60 },
        6: { dmg: 4, radius: 50, row: 6, glowStr: 3, glowColor: 0xD2691E, expScale: 3.0, aoeW: 140, aoeH: 70 },
        7: { dmg: 5, radius: 55, row: 7, glowStr: 4, glowColor: 0xFF8C00, expScale: 3.5, aoeW: 160, aoeH: 80 },
        8: { dmg: 6, radius: 60, row: 8, glowStr: 4, glowColor: 0xFF8C00, expScale: 3.5, aoeW: 180, aoeH: 90 },
        9: { dmg: 7, radius: 65, row: 9, glowStr: 5, glowColor: 0xFFA500, expScale: 4.0, aoeW: 200, aoeH: 100 },
        10: { dmg: 10, radius: 80, row: 9, glowStr: 6, glowColor: 0xFFD700, expScale: 5.0, aoeW: 250, aoeH: 120 }
    };

    const config = this.poopConfig[this.birdLevel];

    this.damage = config.dmg;
    this.explosionRadius = config.radius;
    this.animationRow = config.row;
    this.expScale = config.expScale;
    this.aoeW = config.aoeW;
    this.aoeH = config.aoeH;

    this.auraFX = this.preFX.addGlow(config.glowColor, config.glowStr, 0, false, 0.1, 10);

    // FÍSICA ORIGINAL (Mais natural como solicitado)
    if (this.body) {
        this.body.setCircle(8, 0, 0); 
        this.body.setAllowGravity(true);
        this.body.setGravityY(800); 
        this.body.setVelocityX((velocityX * 0.01) - 100); 
    }
  }

  static preload(scene) {
    // Mantém o sprite original do projétil
    scene.load.image('poop', 'assets/item1193.png');
    
    // NOVO: Spritesheet da explosão (9 linhas, 17 colunas)
    scene.load.spritesheet('poop_explosion', 'assets/702.png', { 
        frameWidth: 64, 
        frameHeight: 64
    });
  }

  static createAnimations(scene) {
    // Gerador das 9 linhas de animação da explosão
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const framesPerRow = 17;

    rows.forEach(row => {
        if (!scene.anims.exists('poop_explosion_row_' + row)) {
            scene.anims.create({
                key: 'poop_explosion_row_' + row,
                frames: scene.anims.generateFrameNumbers('poop_explosion', { 
                    start: (row - 1) * framesPerRow, 
                    end: (row * framesPerRow) - 1 
                }),
                frameRate: 17,
                repeat: 0
            });
        }
    });
  }

  explode() {
    if (this.isExploding) return;
    this.isExploding = true;
    
    // Level 1 não explode
    if (this.birdLevel <= 1) {
        this.destroy();
        return;
    }

    // 1. Inicia a animação (troca para frame de 64x64)
    this.play('poop_explosion_row_' + this.animationRow);

    // 2. Aplica a escala visual da Tabela poopConfig
    this.setScale(this.expScale);

    // FIX VISUAL: Abaixa a Animação
    // O padrão é (0.5, 0.5). Ao aumentar o originY para 0.8,
    // nós estamos dizendo que a âncora do impacto é a 'canela' da animação.
    // Isso visualmente desloca a arte da explosão para BAIXO,
    // fazendo-a coincidir com o ponto de impacto do projétil pequeno.
    this.setOrigin(0.5, 0.8);

    // 3. AGORA SIM: Trava e calcula a física com a textura correta em tela
    if (this.body) {
        this.body.setVelocity(0, 0);
        this.body.setAllowGravity(false);
        this.body.moves = false; 
        
        const realDiameter = this.aoeW / this.expScale; 
        const realRadius = realDiameter / 2;
        
        this.body.setCircle(realRadius, 32 - realRadius, 32 - realRadius); 
        
        // NOVO: HITBOX INSTANTÂNEA
        // Desliga a física após 50ms (tempo suficiente para a engine registrar a colisão)
        // Isso impede que monstros entrem na fumaça atrasados e tomem dano fantasma.
        this.scene.time.delayedCall(50, () => {
            if (this.body) {
                this.body.enable = false; // Desativa completamente as colisões deste objeto
            }
        });
    }

    // EFEITO VISUAL: Brilho Flash de Impacto
    if (this.auraFX) {
        this.auraFX.color = 0xffffff;
        this.auraFX.outerStrength = 10;
        this.scene.tweens.add({
            targets: this.auraFX,
            outerStrength: 0,
            duration: 300,
            ease: 'Power2'
        });
    }

    // 4. Autodestruição ao fim da animação
    this.once('animationcomplete', () => {
        if (this.active) this.destroy();
    });

    // 5. FALLBACK DE SEGURANÇA
    this.scene.time.delayedCall(800, () => {
        if (this.active) this.destroy();
    });
  }
  update() {
    if (this.isExploding) return;

    // Destrói ao sair da tela (por baixo ou lados)
    if (this.y > this.scene.scale.height + 100 || this.x < -100 || this.x > this.scene.scale.width + 100) {
      this.destroy();
    }
  }
}
