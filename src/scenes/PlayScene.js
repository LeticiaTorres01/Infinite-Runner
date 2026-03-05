export default class PlayScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PlayScene' });
        this.bgLayers = [];
    }

    preload() {
        // Carregando na ordem lógica (do fundo do cenário para a frente)
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

        // Função auxiliar para organizar cada camada sem repetir código
        const addLayer = (key, speed, isLight = false) => {
            // Pega a altura original da imagem para fazer a escala correta
            const imgHeight = this.textures.get(key).getSourceImage().height;
            
            // Cria o TileSprite. Y = h (fim da tela) e Origin Y = 1 (base da imagem)
            const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
            
            // Calcula a escala para a imagem preencher a altura da tela perfeitamente
            const scale = h / imgHeight;
            sprite.setScale(scale);
            
            // Como mexemos na escala do objeto, ajustamos a largura interna para não cortar
            sprite.width = w / scale;

            // Se for uma camada de luz, aplicamos o modo de mesclagem para dar o efeito de raio de sol
            if (isLight) {
                sprite.setBlendMode(Phaser.BlendModes.ADD);
                sprite.setAlpha(0.4); // Controle a intensidade da luz aqui (0.0 a 1.0)
            }

            this.bgLayers.push({ sprite: sprite, speed: speed });
        };

        // Adicionando as camadas EXATAMENTE na ordem de profundidade (Z-index)
        addLayer('bg_cielo', 0.1);             // Mais distante
        addLayer('bg_arvores_fundo', 0.2);
        addLayer('bg_luzes_fundo', 0.3, true); // Luz (isLight = true)
        addLayer('bg_arvores_densas', 0.5);
        addLayer('bg_arvores_medias', 0.7);
        addLayer('bg_luzes_frente', 0.8, true); // Luz (isLight = true)
        addLayer('bg_arvores_finas', 1.0);
        addLayer('bg_arbustos', 1.2);
        addLayer('bg_grama_fundo', 1.5);
        addLayer('bg_chao', 2.0);              // Chão onde passará o pássaro (Mais rápido)
    }

    update() {
        // Move o parallax
        this.bgLayers.forEach(layer => {
            layer.sprite.tilePositionX += layer.speed;
        });
    }
}
