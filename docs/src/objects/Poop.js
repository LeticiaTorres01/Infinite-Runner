export default class Poop extends Phaser.Physics.Arcade.Sprite {
  // ATENÇÃO: Nova assinatura recebendo o 'birdLevel'
  constructor(scene, x, y, velocityX, birdLevel = 1) {
    super(scene, x, y, 'poop');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.birdLevel = Math.min(birdLevel, 10); // Trava no level 10
    this.isExploding = false;
    this.setScale(1.5); // Mantém escala natural
    this.setDepth(15);

    // TABELA DE STATUS DO COCÔ (Level: {dmg, radius, row, glowStr, glowColor})
    // O Game Designer pode alterar livremente esses valores para balancear o jogo!
    this.poopConfig = {
        1: { dmg: 2, radius: 25, row: 1, glowStr: 1, glowColor: 0x8B4513 }, // Marrom Escuro
        2: { dmg: 2, radius: 30, row: 2, glowStr: 1, glowColor: 0xA0522D }, // Siena
        3: { dmg: 3, radius: 35, row: 3, glowStr: 2, glowColor: 0xCD853F }, // Peru
        4: { dmg: 3, radius: 40, row: 4, glowStr: 2, glowColor: 0xCD853F }, // Peru
        5: { dmg: 4, radius: 45, row: 5, glowStr: 3, glowColor: 0xD2691E }, // Chocolate
        6: { dmg: 4, radius: 50, row: 6, glowStr: 3, glowColor: 0xD2691E }, // Chocolate
        7: { dmg: 5, radius: 55, row: 7, glowStr: 4, glowColor: 0xFF8C00 }, // Laranja Escuro
        8: { dmg: 6, radius: 60, row: 8, glowStr: 4, glowColor: 0xFF8C00 }, // Laranja Escuro
        9: { dmg: 7, radius: 65, row: 9, glowStr: 5, glowColor: 0xFFA500 }, // Laranja
        10: { dmg: 10, radius: 80, row: 9, glowStr: 6, glowColor: 0xFFD700 } // Ouro (Dano Massivo)
    };

    // Busca a configuração do nível atual
    const config = this.poopConfig[this.birdLevel];

    // Aplica os status
    this.damage = config.dmg;
    this.explosionRadius = config.radius;
    this.animationRow = config.row;

    // EFEITO VISUAL (GLOW) usando a tabela
    this.auraFX = this.preFX.addGlow(config.glowColor, config.glowStr, 0, false, 0.1, 10);

    // FÍSICA ORIGINAL (Mais natural como solicitado)
    if (this.body) {
        this.body.setCircle(8);
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
                frameRate: 30, // Bem rápido para o impacto
                repeat: 0
            });
        }
    });
  }

  explode() {
    if (this.isExploding) return;
    this.isExploding = true;
    
    // 1. Congela a física completamente para não brigar com o colisor do chão
    if (this.body) {
        this.body.setVelocity(0, 0);
        this.body.setAllowGravity(false);
        this.body.moves = false; // Diz à engine Arcade para parar de tentar mover/empurrar este objeto
        
        // 2. Aumenta a Hitbox (AoE) usando o valor configurado na Tabela
        // Compensa o offset para o centro da explosão ficar onde o cocô bateu
        this.body.setCircle(this.explosionRadius, 8 - this.explosionRadius, 8 - this.explosionRadius);
    }
    
    if (this.auraFX) this.auraFX.active = false;

    // 3. Tenta tocar a animação respectiva configurada na Tabela
    this.play('poop_explosion_row_' + this.animationRow);

    // 4. Autodestruição ao fim da animação (Ideal)
    this.once('animationcomplete', () => {
        if (this.active) this.destroy();
    });

    // 5. FALLBACK DE SEGURANÇA (Plano B)
    // Se a animação não rodar (por erro de tamanho de frame ou asset), destrói a hitbox após 400ms 
    // para não quebrar o jogo deixando um 'campo de força' invisível.
    this.scene.time.delayedCall(400, () => {
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
