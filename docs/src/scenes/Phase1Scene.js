import Bird from '../objects/Bird.js';
import Mushroom from '../objects/Mushroom.js';
import Bee from '../objects/Bee.js';
import Poop from '../objects/Poop.js';
import Flicker from '../objects/Flicker.js';
import Orange from '../objects/Orange.js';
import Fairy from '../objects/Fairy.js';
import BlueCoin from '../objects/BlueCoin.js';
import RedCoin from '../objects/RedCoin.js';
import GoldCoin from '../objects/GoldCoin.js';
import Fruit from '../objects/Fruit.js';
import MagicProjectile from '../objects/MagicProjectile.js';
import SwordBoss from '../objects/SwordBoss.js';
import SaveService from '../services/SaveService.js';
import { SettingsService } from '../services/SettingsService.js';
import { InputProfileService } from '../services/InputProfileService.js';

export default class Phase1Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Phase1Scene' });
    this.bgLayers = [];
    this.bird = null;
    this.boss = null;
    this.mushrooms = null;
    this.bees = null;
    this.flickers = null;
    this.coins = null;
    this.goldCoins = null;
    this.fruits = null;
    this.poops = null;
    this.fairies = null;
    this.enemyProjectiles = null;
    this.isGameStarted = false;
    this.isPaused = false;
    this.isGameOver = false;
    this.isTransitioning = false;
    this.bgSpeedFactor = 1.0;
    this.hearts = [];
    this.shieldIcons = [];
    this.onFairyShoot = null;
    this.continueData = null;
    this.saveSlotId = null;
    this.lowHealthBorder = null;
    this.lowHealthTween = null;
    this.sfxMasterVolume = 1;

    // --- ROUND MANAGER STATE ---
    this.currentRound = 1;
    this.spawnQueue = [];
    this.isSpawningFinished = false; 
    this.isRoundTransitioning = false; 

    this.roundRecipes = [
        // Round 1: Introducao rapida e clara, com ondas curtas e sem enrolacao.
        {
            round: 1,
            scripted: true,
            sequence: [
                { type: 'flicker', delay: 1800 },
                { type: 'coin', delay: 0 },
                { type: 'flicker', delay: 1200 },
                { type: 'coin', delay: 0 },
                { type: 'flicker', delay: 1200 },
                { type: 'coin', delay: 0 },
                { type: 'flicker', delay: 1200 },
                { type: 'coin', delay: 0 },
                { type: 'wait_clear' },

                { type: 'mushroom', delay: 1200 },
                { type: 'coin', delay: 0 },
                { type: 'mushroom', delay: 1200 },
                { type: 'wait_clear' },

                { type: 'flicker', delay: 700 },
                { type: 'coin', delay: 0 },
                { type: 'mushroom', delay: 1200 },
                { type: 'coin', delay: 0 },
                { type: 'mushroom', delay: 1200 },
                { type: 'flicker', delay: 700 },
                { type: 'coin', delay: 0 },
                { type: 'wait_clear' }
            ]
        },
        
        // Round 2: NOVO MODELO SCRIPTADO (Comandos em ordem cronológica)
        { 
            round: 2, 
            scripted: true, 
            sequence: [
                // 1. Apresenta que ele está mais forte (4 Flickers normais)
                { type: 'flicker', delay: 1000 },
                { type: 'mushroom', delay: 0 },
                { type: 'mushroom', delay: 1800 },
                { type: 'coin', delay: 0 },
                { type: 'flicker', delay: 0 },
                { type: 'mushroom', delay: 1800 },
                { type: 'flicker', delay: 0 },
                { type: 'coin', delay: 0 },
                { type: 'flicker', delay: 1400 },
                
                // 2. Espera a tela ficar 100% limpa
                { type: 'wait_clear' },
                { type: 'blue_coin', delay: 1800 },
                
                // 3. Nasce 3 cogumelos com ritmo mais rapido
                { type: 'coin', delay: 0 },
                { type: 'mushroom', delay: 2200 },
                { type: 'flicker', delay: 0 },
                { type: 'mushroom', delay: 1800 },
                { type: 'flicker', delay: 0 },
                { type: 'coin', delay: 0 },
                { type: 'coin', delay: 0 },
                { type: 'mushroom', delay: 2200 },
                
                // 4. Espera a tela ficar 100% limpa (seja por morte ou por saírem da tela)
                { type: 'wait_clear' },
                
                // 5. Apresenta as abelhas (entrada mais enxuta)
                { type: 'bee', delay: 1400 },
                { type: 'bee', delay: 1800 },
                
                // 6. Fim do round (Garante que só acaba quando a tela limpar)
                { type: 'wait_clear' }
            ]
        },
        // Round 3: Upa para Lvl 3, ganha escudo, e enfrenta 3 ondas conjuntas.
        { 
            round: 3, 
            scripted: true, 
            sequence: [
                // 1. 4 Flickers para upar para o Lvl 3 e curar, com menos espera
                { type: 'flicker', delay: 1000 },
                { type: 'bee', delay: 0 },
                { type: 'flicker', delay: 1000 },
                { type: 'bee', delay: 0 },
                { type: 'flicker', delay: 1000 },
                { type: 'bee', delay: 0 },
                { type: 'flicker', delay: 1000 },
                
                { type: 'wait_clear' },
                
                { type: 'blue_coin', delay: 1800 },
                
                // 3. Ondas conjuntas mais curtas + Moedas Douradas
                // ONDA 1
                { type: 'mushroom', delay: 500 },
                { type: 'bee', delay: 0 },
                { type: 'flicker', delay: 1000 },
                { type: 'bee', delay: 0 },
                { type: 'gold_coin', delay: 500 },
                { type: 'bee', delay: 0 },
                { type: 'mushroom', delay: 500 },
                { type: 'flicker', delay: 1000 },
                { type: 'gold_coin', delay: 9000 },
                
                // ONDA 2
                { type: 'mushroom', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'mushroom', delay: 500 },
                { type: 'bee', delay: 0 },
                { type: 'mushroom', delay: 500 },
                { type: 'bee', delay: 0 },
                { type: 'mushroom', delay: 500 },
                { type: 'gold_coin', delay: 500 },
                { type: 'gold_coin', delay: 9000 },
                
                { type: 'red_coin', delay: 1000 }, // Moeda de cura!
                // ONDA 3
                { type: 'mushroom', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'gold_coin', delay: 500 },
                { type: 'gold_coin', delay: 0 }, // Sendo a última, não precisa do longo delay
                
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 4, 
            scripted: true, 
            sequence: [
                // 1. A Barreira (Todos com delay 0 nascem no mesmo instante, mesma posição X, posições Y diferentes)
                { type: 'red_coin', delay: 1000 }, // Moeda de cura!
                { type: 'flicker', x: 2100, y: 50, delay: 0 },
                { type: 'flicker', x: 2100, y: 150, delay: 0 },
                { type: 'flicker', x: 2100, y: 250, delay: 0 },
                { type: 'flicker', x: 2100, y: 350, delay: 0 },
                { type: 'flicker', x: 2100, y: 450, delay: 0 },
                { type: 'flicker', x: 2100, y: 550, delay: 0 },
                { type: 'flicker', x: 2100, y: 650, delay: 0 },
                { type: 'flicker', x: 2100, y: 750, delay: 0 },
                { type: 'flicker', x: 2100, y: 850, delay: 0 },
                { type: 'flicker', x: 2100, y: 950, delay: 3000 }, // O último dá o tempo de espera
                
                { type: 'wait_clear' },
                
                // 2. Apresenta o novo perigo: O Cogumelo Evoluído (sozinho para ele entender que é tanque)
                { type: 'mushroom', upgraded: true, delay: 4000 },
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 4000 },
                
                { type: 'wait_clear' },
                
                // 3. A Recompensa e o teste de sinergia
                { type: 'flicker', delay: 1000 },
                { type: 'mushroom', upgraded: true, delay: 4000 },
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'flicker', delay: 1000 },
                { type: 'mushroom', upgraded: true, delay: 4000 },
                { type: 'red_coin', delay: 1000 }, // Moeda de cura!
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'bee', delay: 0 },
                { type: 'mushroom', upgraded: true, delay: 0 },
                
                { type: 'wait_clear' }
            ]
        },
        { 
            round: 5, 
            scripted: true, 
            sequence: [
                // 1. Primeira Parede Horizontal: Flickers no meio da tela, obrigando o desvio
                { type: 'flicker', upgraded: true, x: 1900, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2000, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2100, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2200, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 1900, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2000, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2100, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2200, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2300, y: 500, delay: 3500 },
                
                { type: 'wait_clear' },
                
                // 2. Cogumelos para forçar o jogador p/ cima ou p/ baixo (verticalmente)
                { type: 'mushroom', upgraded: true, delay: 0 },
                { type: 'mushroom', delay: 800 },
                { type: 'gold_coin', delay: 0 },
                { type: 'flicker', upgraded: true, delay: 1000 },
                { type: 'mushroom', upgraded: true, delay: 0 },
                { type: 'gold_coin', delay: 0 },
                { type: 'mushroom', delay: 800 },
                { type: 'flicker', upgraded: true, delay: 1000 },
                { type: 'mushroom', upgraded: true, delay: 0 },
                { type: 'gold_coin', delay: 0 },
                { type: 'flicker', upgraded: true, delay: 1000 },
                
                { type: 'wait_clear' },
                
                // 3. Recompensa com aceleração p/ próxima onda
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                
                { type: 'wait_clear' }
            ]
        },
        // ROUND 6: Foco em acrobacias aéreas e Parede Horizontal em formação diagonal
        { 
            round: 6, 
            scripted: true, 
            sequence: [
                // 1. Parede Horizontal Baixa: Força o jogador a subir rapidamente
                { type: 'flicker', upgraded: true, x: 1850, y: 850, delay: 0 },
                { type: 'flicker', upgraded: true, x: 1950, y: 850, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2050, y: 850, delay: 0 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'flicker', upgraded: true, x: 2150, y: 850, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2250, y: 850, delay: 3000 },
                { type: 'wait_clear' },
                
                // 2. Punição Aérea enquanto ele está em cima: Abelhas rápidas
                { type: 'bee', upgraded: true, delay: 500 },
                { type: 'bee', upgraded: true, delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'flicker', upgraded: true, x: 1900, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2000, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2100, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2200, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 1900, y: 500, delay: 0 },
                { type: 'flicker', x: 2100, y: 50, delay: 0 },
                { type: 'flicker', x: 2100, y: 150, delay: 0 },
                { type: 'flicker', x: 2100, y: 250, delay: 0 },
                { type: 'flicker', x: 2100, y: 350, delay: 0 },
                { type: 'flicker', x: 2100, y: 450, delay: 0 },
                { type: 'flicker', x: 2100, y: 550, delay: 0 },
                { type: 'flicker', x: 2100, y: 650, delay: 0 },
                { type: 'flicker', x: 2100, y: 750, delay: 0 },
                { type: 'flicker', x: 2100, y: 850, delay: 0 },
                { type: 'flicker', x: 2100, y: 950, delay: 0 }, // O último dá o tempo de espera
                { type: 'flicker', upgraded: true, x: 2000, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2100, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2200, y: 500, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2300, y: 500, delay: 3500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', delay: 1500 },
                { type: 'wait_clear' },

                // 3. Parede Horizontal Alta: Força o jogador a descer (problema: laranja embaixo)
                { type: 'orange', delay: 0 },
                { type: 'flicker', upgraded: true, x: 1900, y: 200, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2000, y: 200, delay: 0 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'flicker', upgraded: true, x: 2100, y: 200, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2200, y: 200, delay: 0 },
                { type: 'flicker', upgraded: true, x: 2300, y: 200, delay: 2000 },
                { type: 'wait_clear' },
                
                // 4. Recompensa após sobreviver às duas paredes
                { type: 'blue_coin', delay: 500 },
                { type: 'gold_coin', y: 300, delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'bee', upgraded: true, delay: 1500 },
                { type: 'red_coin', delay: 500 },
                { type: 'gold_coin', y: 700, delay: 500 },
                { type: 'gold_coin', y: 500, delay: 0 },
                { type: 'wait_clear' }
            ]
        },

        // ROUND 7: Menos parede, mais combate real + estreia da Fairy normal.
        { 
            round: 7, 
            scripted: true, 
            sequence: [
            // 1. Parede curta no meio + pressão de chão
            { type: 'flicker', x: 1950, y: 500, delay: 0 },
            { type: 'flicker', x: 2050, y: 500, delay: 0 },
            { type: 'flicker', x: 2150, y: 500, delay: 0 },
            { type: 'flicker', x: 2250, y: 500, delay: 400 },
            { type: 'mushroom', delay: 500 },
            { type: 'orange', delay: 1000 },
                { type: 'wait_clear' },

            // 2. Combate misto com Fairy normal dando suporte de tiro
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'bee', delay: 600 },
            { type: 'bee', delay: 600 },
            { type: 'mushroom', delay: 500 },
            { type: 'orange', delay: 900 },
                { type: 'wait_clear' },

            // 3. Fechamento agressivo com parede curta alta e enxame
            { type: 'flicker', x: 1950, y: 250, delay: 0 },
            { type: 'flicker', x: 2050, y: 250, delay: 0 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'flicker', x: 2150, y: 250, delay: 0 },
            { type: 'flicker', x: 2250, y: 250, delay: 300 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'bee', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'bee', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'mushroom', delay: 800 },
                { type: 'wait_clear' },

            // 4. Recompensa
                { type: 'red_coin', delay: 800 },
                { type: 'blue_coin', delay: 500 },
                { type: 'gold_coin', y: 200, delay: 500 },
                { type: 'gold_coin', y: 500, delay: 500 },
                { type: 'gold_coin', y: 800, delay: 0 },
                { type: 'wait_clear' }
            ]
        },

        // ROUND 8: Menos labirinto, mais mistura constante com Fairy normal.
        { 
            round: 8, 
            scripted: true, 
            sequence: [
            // 1. Parede baixa curta com laranja e bee
            { type: 'flicker', x: 1950, y: 760, delay: 0 },
            { type: 'flicker', x: 2050, y: 760, delay: 0 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'flicker', x: 2150, y: 760, delay: 300 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'orange', delay: 500 },
            { type: 'bee', delay: 900 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'wait_clear' },

            // 2. Fairy + pressão cruzada de ar/chão
            { type: 'fairy', x: 2200, y: 190, delay: 300 },
            { type: 'bee', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'mushroom', delay: 500 },
            { type: 'orange', delay: 700 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'bee', delay: 700 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'wait_clear' },

            // 3. Onda cheia sem parede longa
            { type: 'mushroom', delay: 0 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'bee', delay: 400 },
            { type: 'orange', delay: 600 },
            { type: 'flicker', y: 320, delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'flicker', y: 640, delay: 500 },
            { type: 'bee', delay: 700 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'wait_clear' },

                // 4. Recompensa após as 3 fileiras
                { type: 'blue_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'gold_coin', y: 200, delay: 0 },
                { type: 'gold_coin', y: 500, delay: 0 },
                { type: 'gold_coin', y: 800, delay: 0 },
                { type: 'wait_clear' }
            ]
        },

        // ROUND 9: Combate pesado com apenas paredes curtas de controle.
        { 
            round: 9, 
            scripted: true, 
            sequence: [
            // 1. Abertura agressiva de chão + ar
            { type: 'mushroom', delay: 0 },
            { type: 'orange', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'bee', delay: 500 },
            { type: 'bee', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'flicker', y: 280, delay: 700 },
                { type: 'wait_clear' },

            // 2. Parede média curta + Fairy normal
            { type: 'flicker', x: 2000, y: 500, delay: 0 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'flicker', x: 2100, y: 500, delay: 0 },
            { type: 'flicker', x: 2200, y: 500, delay: 300 },
            { type: 'fairy', x: 2200, y: 220, delay: 600 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'orange', delay: 800 },
            { type: 'mushroom', delay: 600 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'wait_clear' },

            // 3. Pico de combate sem parede
            { type: 'bee', delay: 300 },
            { type: 'bee', delay: 300 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'mushroom', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'orange', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'flicker', y: 700, delay: 600 },
            { type: 'bee', delay: 700 },
                { type: 'wait_clear' },

                // 4. Recompensa Massiva (Sobreviver a tudo isso merece generosidade)
                { type: 'blue_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'gold_coin', y: 200, delay: 500 },
                { type: 'gold_coin', y: 500, delay: 500 },
                { type: 'gold_coin', y: 800, delay: 0 },
                { type: 'wait_clear' }
            ]
        },

        // ROUND 10: Climax com combate dominante e paredes curtas de decisão.
        { 
            round: 10, 
            scripted: true, 
            sequence: [
            // TESTE 1: Controle inicial com parede curta
            { type: 'flicker', x: 1950, y: 250, delay: 0 },
            { type: 'flicker', x: 2050, y: 250, delay: 0 },
            { type: 'flicker', x: 2150, y: 250, delay: 300 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'orange', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'orange', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'orange', delay: 500 },
            { type: 'mushroom', delay: 700 },
            { type: 'bee', delay: 700 },
                { type: 'wait_clear' },

            // TESTE 2: Fairy normal com enxame e chão agressivo
            { type: 'fairy', x: 2200, y: 180, delay: 400 },
            { type: 'bee', delay: 400 },
            { type: 'bee', delay: 400 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'orange', delay: 500 },
            { type: 'orange', delay: 500 },
            { type: 'fairy', x: 2250, y: 260, delay: 600 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'orange', delay: 500 },
            { type: 'mushroom', delay: 700 },
            { type: 'flicker', y: 500, delay: 500 },
            { type: 'flicker', y: 620, delay: 500 },
                { type: 'wait_clear' },

            // TESTE 3: Grande finale de combate misto
                { type: 'orange', delay: 0 },
            { type: 'mushroom', delay: 0 },
            { type: 'bee', delay: 300 },
            { type: 'orange', delay: 500 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
            { type: 'orange', delay: 500 },
            { type: 'flicker', y: 250, delay: 400 },
            { type: 'flicker', y: 500, delay: 400 },
            { type: 'fairy', x: 2150, y: 230, delay: 400 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
            { type: 'orange', delay: 500 },
            { type: 'flicker', y: 780, delay: 500 },
            { type: 'fairy', x: 2250, y: 260, delay: 600 },
            { type: 'bee', delay: 500 },
            { type: 'mushroom', delay: 700 },
                { type: 'wait_clear' },
                
                // RECOMPENSA FINAL: Chuva de Tudo para garantir Lvl 7 e entrada em Phase 2
                { type: 'blue_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'gold_coin', y: 200, delay: 500 },
                { type: 'gold_coin', y: 500, delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'red_coin', delay: 500 },
                { type: 'gold_coin', y: 800, delay: 500 },
                { type: 'gold_coin', y: 350, delay: 500 },
                { type: 'gold_coin', y: 650, delay: 0 },
                { type: 'wait_clear' }
            ]
        }
    ];
  }

    init(data) {
        this.continueData = data && data.continueData ? data.continueData : null;
        this.saveSlotId = Number.isFinite(data && data.saveSlotId) ? Math.floor(data.saveSlotId) : null;
        if (this.continueData && Number.isFinite(this.continueData.slotId)) {
            this.saveSlotId = Math.floor(this.continueData.slotId);
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

        const safeRound = Phaser.Math.Clamp(Math.floor(round || 1), 1, this.roundRecipes.length);
        const updatedRun = SaveService.saveCheckpoint({
            slotId: this.saveSlotId,
            currentPhase: 1,
            currentRound: safeRound,
            birdData
        });
        if (updatedRun && Number.isFinite(updatedRun.slotId)) {
            this.saveSlotId = updatedRun.slotId;
        }
    }

  preload() {
    Bird.preload(this); Mushroom.preload(this); Bee.preload(this); Flicker.preload(this);
    Orange.preload(this); Fairy.preload(this); BlueCoin.preload(this); RedCoin.preload(this); GoldCoin.preload(this); Fruit.preload(this);
    this.load.image('hearth', 'assets/hearth.png');
    this.load.image('hearth_dead', 'assets/item1167.png');
    this.load.image('shield_icon', 'assets/item199.png');
    this.load.image('poop_icon', 'assets/item1193.png');
    this.load.image('heal_item_icon', 'assets/item535.png'); // Ícone da HUD
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

    // SOUNDTRACK
    this.load.audio('bgm_pre_start', 'assets/soundtrack/pre-start.mp3');
    this.load.audio('bgm_phase1', 'assets/soundtrack/phase1.mp3');
        this.load.audio('bgm_phase1_music2', 'assets/soundtrack/phase1_music2.mp3');
    this.load.audio('bgm_phase2', 'assets/soundtrack/phase2.mp3');
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
    const w = 1920; const h = 1080;
    this.isGameStarted = false; this.isPaused = false; this.isGameOver = false;
    this.isTransitioning = false; this.bgSpeedFactor = 1.0;
    this.bgLayers = []; this.hearts = []; this.shieldIcons = [];
    this.currentRound = 1; this.spawnQueue = [];
    this.isSpawningFinished = false; this.isRoundTransitioning = false;

    Bird.createAnimations(this); Mushroom.createAnimations(this); Bee.createAnimations(this);
    Flicker.createAnimations(this); Orange.createAnimations(this); Fairy.createAnimations(this);
    BlueCoin.createAnimations(this); RedCoin.createAnimations(this); GoldCoin.createAnimations(this); Poop.createAnimations(this);

    const addLayer = (key, speed, isLight = false) => {
      const texture = this.textures.get(key);
      const img = texture.getSourceImage();
      const imgHeight = (img && img.height) ? img.height : 512;
      const sprite = this.add.tileSprite(0, h, w, imgHeight, key).setOrigin(0, 1);
      const scale = h / imgHeight;
      sprite.setScale(scale);
      sprite.width = w / scale;
      if (isLight) { sprite.setBlendMode(Phaser.BlendModes.ADD); sprite.setAlpha(0.4); }
      this.bgLayers.push({ sprite: sprite, speed: speed });
    };

    addLayer('ceu_sombrio', 0.02); addLayer('bg_cielo', 0.1); addLayer('bg_arvores_fundo', 0.2); addLayer('bg_luzes_fundo', 0.3, true);
    addLayer('bg_arvores_densas', 0.5); addLayer('bg_arvores_medias', 0.7); addLayer('bg_luzes_frente', 0.8, true);
    addLayer('bg_arvores_finas', 1.0); addLayer('bg_arbustos', 1.2); addLayer('bg_grama_fundo', 1.5); addLayer('bg_chao', 2.0);

    const groundHeight = 60; 
    this.ground = this.add.rectangle(-2000, h - groundHeight, w + 4000, groundHeight).setOrigin(0, 0);
    this.physics.add.existing(this.ground, true);

    this.bird = new Bird(this, -200, h / 2); this.bird.setDepth(50);
    if (this.bird.body) this.bird.body.enable = false;

    this.physics.add.collider(this.bird, this.ground, () => { if (!this.bird.isDead) this.bird.takeDamage(); });

    this.mushrooms = this.add.group(); this.bees = this.add.group(); this.flickers = this.add.group();
    this.coins = this.add.group(); this.redCoins = this.add.group(); this.goldCoins = this.add.group(); this.fruits = this.add.group();
        this.poops = this.add.group(); this.oranges = this.add.group(); this.fairies = this.add.group(); this.enemyProjectiles = this.add.group();

        this.onFairyShoot = (proj) => {
            if (proj && proj.active) this.enemyProjectiles.add(proj);
        };
        this.events.on('fairyShoot', this.onFairyShoot);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.events.off('fairyShoot', this.onFairyShoot);
        });

    // SETUP DE CONTROLES: Usa o perfil de controle salvo em SettingsService
    const controlScheme = SettingsService.getControlScheme();
    const inputBindings = InputProfileService.createInputBindings(this, controlScheme);
    this.bird.setControlBindings(inputBindings);

    // Setup de teclas extras fora do perfil de jogador
    this.cursors = inputBindings.cursors;  // Guarda para referência da cena se necessário
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // SOUND MANAGER
    this.sound.stopAll();
    
    // Carrega volume master das configurações
    const masterVolume = SettingsService.getMasterVolume() / 100; // Normaliza de 0-100 para 0-1
    this.sfxMasterVolume = masterVolume;
    
    this.bgmPhase1 = this.sound.add('bgm_phase1', { loop: true, volume: 0 });
    this.bgmPhase1Music2 = this.sound.add('bgm_phase1_music2', { loop: true, volume: 0 });
    this.bgmPause = this.sound.add('bgm_pause', { loop: true, volume: 0.3 });
    this.muteKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    
    this.bgmPhase1.play();
    this.tweens.add({
        targets: this.bgmPhase1,
        volume: 0.4 * masterVolume,  // Aplica volume master à transição
        duration: 2000
    });

    this.createHeartsHUD();
    this.createAmmoHUD();
    this.createShieldInventoryHUD();
    this.createHealInventoryHUD();
    this.createProgressionHUD();

    this.events.on('updateLives', (data) => this.updateHeartsHUD(data));
    this.events.on('updateAmmo', (ammo) => this.updateAmmoHUD(ammo));
    this.events.on('updateStoredShields', (count) => this.updateShieldInventoryHUD(count));
    this.events.on('updateProgress', (data) => this.updateProgressionHUD(data));
    this.events.on('updateMaxLives', (maxLives) => this.rebuildHeartsHUD(maxLives));

    if (this.continueData && this.continueData.currentPhase === 1) {
        if (this.continueData.birdData && this.bird) {
            this.bird.syncFromData(this.continueData.birdData);
        }

        if (Number.isFinite(this.continueData.slotId)) {
            this.saveSlotId = Math.floor(this.continueData.slotId);
        }

        this.currentRound = Phaser.Math.Clamp(
            Math.floor(this.continueData.currentRound || 1),
            1,
            this.roundRecipes.length
        );
        this.updateRoundHUD();

        if (this.currentRound >= 4) {
            this.transitionToMusic(this.bgmPhase1Music2, 0.4, 1200);
        }
    }

    const handlePoopHit = (poop, enemy) => {
        if (enemy.isDead || !enemy.active) return;

        // Se for uma explosão, garante que só dá dano UMA VEZ em cada inimigo
        if (poop.isExploding) {
            if (poop.hitEnemies && poop.hitEnemies.has(enemy)) return;
            if (poop.hitEnemies) poop.hitEnemies.add(enemy);
        }

        const enemyCurrentHP = enemy.hp || 1; 
        
        // Causa o dano do projétil/explosão
        if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(poop.damage);
            this.playRandomCocoMonstro({ volume: 0.7 });
        } else {
            enemy.die();
            this.playRandomCocoMonstro({ volume: 0.7 });
        }

        // Regra de Penetração e Destruição (Apenas para o projétil em voo)
        if (!poop.isExploding) {
            if (poop.damage > enemyCurrentHP) {
                // Atravessa o inimigo
                poop.damage -= enemyCurrentHP;
                if (poop.auraFX) {
                    poop.auraFX.outerStrength = Math.max(poop.auraFX.outerStrength - 1, 0); 
                }
            } else {
                // Absorvido: some sem explodir
                poop.destroy(); 
            }
        }
    };

    this.physics.add.overlap(this.poops, this.mushrooms, handlePoopHit);
    this.physics.add.overlap(this.poops, this.flickers, handlePoopHit);
    this.physics.add.overlap(this.poops, this.bees, handlePoopHit);
    this.physics.add.overlap(this.poops, this.oranges, handlePoopHit);
    this.physics.add.overlap(this.poops, this.fairies, handlePoopHit);

    this.physics.add.collider(this.poops, this.ground, (poop, ground) => {
        if (!poop.isExploding) {
            poop.explode();
        }
    });

    const handleEnemyCollision = (bird, enemy) => {
        if (enemy.isDead || bird.isDead) return;

        if (bird.isDashing) {
            // Se o pássaro está no Dash: Ele causa dano APENAS UMA VEZ por inimigo neste dash
            if (bird.dashHitEnemies && bird.dashHitEnemies.has(enemy)) return;
            if (bird.dashHitEnemies) bird.dashHitEnemies.add(enemy);

            if (typeof enemy.takeDamage === 'function') {
                enemy.takeDamage(bird.dashDamage || 1);
            } else {
                enemy.die(); 
            }
        } else {
            // Se o pássaro NÃO está no Dash: Ele sofre dano, mas NÃO mata o monstro com o corpo
            bird.takeDamage();
        }
    };

    this.physics.add.overlap(this.bird, this.flickers, handleEnemyCollision);
    this.physics.add.overlap(this.bird, this.bees, handleEnemyCollision);
    this.physics.add.overlap(this.bird, this.mushrooms, handleEnemyCollision);
    this.physics.add.overlap(this.bird, this.oranges, handleEnemyCollision);
    this.physics.add.overlap(this.bird, this.fairies, handleEnemyCollision);
    this.physics.add.overlap(this.bird, this.enemyProjectiles, (bird, proj) => {
        if (!bird.isDead && !bird.isDashing && !bird.isInvincible) {
            bird.takeDamage();
        }
        if (proj && proj.active) proj.destroy();
    });

    this.physics.add.overlap(this.bird, this.redCoins, (bird, coin) => { if (!bird.isDead && !coin.isCollected) { coin.collect(bird); } });
    this.physics.add.overlap(this.bird, this.coins, (bird, coin) => { if (!bird.isDead && !coin.isCollected) { coin.collect(); bird.collectShieldItem(); bird.gainExperience(5, 50); } });
    this.physics.add.overlap(this.bird, this.goldCoins, (bird, coin) => { if (!bird.isDead && !coin.isCollected) { coin.collect(bird); } });
    this.physics.add.overlap(this.bird, this.fruits, (bird, fruit) => { if (!bird.isDead && !fruit.isCollected) { fruit.collect(bird); } });

    // CORREÇÃO: Garante que as animações e física não fiquem travadas ao reiniciar
    this.anims.resumeAll(); 
    this.physics.resume();

    this.createPauseMenu(w, h); this.createGameOverMenu(w, h);
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.bird.setVisible(false); this.setHUDAlpha(0);

    // AUTO-START: Começa a intro cinematográfica direto
    this.startCinematicIntro();
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
    // ADICIONADO: Garante que a barra de round e seu texto sigam a opacidade da HUD
    if (this.roundBarBg) this.roundBarBg.setAlpha(alpha * 0.6);
    if (this.roundBarFill) this.roundBarFill.setAlpha(alpha * 0.8);
    if (this.roundHeaderText) this.roundHeaderText.setAlpha(alpha * 0.8);
  }

  startCinematicIntro() {
    const w = 1920;
    const h = 1080;
    
    this.bird.setPosition(-200, h / 2); this.bird.setVisible(true);
    if (this.bird.body) this.bird.body.enable = true;
    this.tweens.add({
        targets: this.bird, x: 300, duration: 3000, ease: 'Power2.easeOut',
        onComplete: () => {
            this.isGameStarted = true; this.bird.setCollideWorldBounds(true); this.startRound();
            
            // SPAWN DE FRUTAS CONSTANTE (A cada 4000ms)
            const scheduleNextFruitSpawn = () => {
                if (!this.sys || !this.sys.isActive()) return;

                const delay = this.currentRound >= 7 ? 2200 : 4000;

                this.time.delayedCall(delay, () => {
                    if (!this.sys || !this.sys.isActive()) return;

                    if (this.isGameStarted && !this.isGameOver && !this.isPaused) {
                        // Round 5 e 6: mantém chance de redução do spawn.
                        if ((this.currentRound === 5 || this.currentRound === 6) && Phaser.Math.Between(1, 100) <= 70) {
                            scheduleNextFruitSpawn();
                            return;
                        }

                        const w = 1920;
                        const fruitType = Phaser.Utils.Array.GetRandom(['fruit_apple', 'fruit_banana', 'fruit_cherry']);
                        this.fruits.add(new Fruit(this, w + 200, Phaser.Math.Between(300, 600), fruitType));
                    }

                    scheduleNextFruitSpawn();
                });
            };

            scheduleNextFruitSpawn();

            // HUD Geral exceto Score e Round Bar
            this.tweens.add({
                targets: [ ...this.hearts, ...this.shieldIcons, this.ammoIcon, this.ammoText, this.shieldInvIcon, this.shieldInvText, this.healInvIcon, this.healInvText, this.levelText, this.xpBarBgGraphics, this.xpBarGraphics ],
                alpha: 1, duration: 1500, ease: 'Linear'
            });

            // Score semi-transparente
            this.tweens.add({
                targets: this.scoreText,
                alpha: 0.5,
                duration: 1500,
                ease: 'Linear'
            });

            // Round HUD (Suave junto com o resto)
            this.tweens.add({
                targets: [this.roundBarBg, this.roundBarFill],
                alpha: 1, duration: 1500, ease: 'Linear'
            });
            this.tweens.add({
                targets: this.roundHeaderText,
                alpha: 0.8, duration: 1500, ease: 'Linear'
            });
        }
    });
  }

  startRound() {
    if (this.isGameOver) return;
    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    if (!recipe) { this.startTransitionToPhase2(); return; }

        if (this.currentRound >= 4) {
                this.transitionToMusic(this.bgmPhase1Music2, 0.4, 2000);
        }
    
    const w = 1920; const h = 1080;
    const roundText = this.add.text(w / 2, h / 2, `ROUND ${this.currentRound}`, { fontFamily: 'KenneyRocket', fontSize: '100px', fill: '#fff', stroke: '#000', strokeThickness: 12 }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({ targets: roundText, alpha: 0, y: h / 2 - 200, duration: 2500, ease: 'Power2', onComplete: () => roundText.destroy() });
    
    // REMOVIDO: O fade-in abrupto que causava o problema
    this.tweens.add({
        targets: [this.roundBarBg, this.roundBarFill],
        alpha: 1, duration: 500, ease: 'Linear'
    });
    this.tweens.add({
        targets: this.roundHeaderText,
        alpha: 0.8, duration: 500, ease: 'Linear'
    });
    this.updateRoundHUD();

    this.isSpawningFinished = false; 
    this.isRoundTransitioning = false; 
    this.spawnQueue = [];

    // Lógica para verificar se o Round tem um script pronto
    if (recipe.scripted) {
        this.spawnQueue = [...recipe.sequence]; // Clona a sequência
    } else {
        // Logica clássica para os rounds antigos
        for (let i = 0; i < recipe.flickers; i++) this.spawnQueue.push({ type: 'flicker' });
        for (let i = 0; i < recipe.mushrooms; i++) this.spawnQueue.push({ type: 'mushroom' });
        for (let i = 0; i < recipe.bees; i++) this.spawnQueue.push({ type: 'bee' });
        for (let i = 0; i < (recipe.oranges || 0); i++) this.spawnQueue.push({ type: 'orange' });
        for (let i = 0; i < recipe.coins; i++) this.spawnQueue.push({ type: 'coin' });
        Phaser.Utils.Array.Shuffle(this.spawnQueue); 
    }
    
    this.updateRoundHUD(); // Garante que a barra comece atualizada
    this.processSpawnQueue();
  }

    transitionToMusic(nextTrack, targetVolume = 0.4, duration = 2000) {
        if (!nextTrack) return;

        const allTracks = [this.bgmPhase1, this.bgmPhase1Music2].filter(Boolean);

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

  processSpawnQueue() {
    if (this.isGameOver) return;

    // CORREÇÃO: Se estiver pausado, reagenda a tentativa em 500ms em vez de quebrar a fila
    if (this.isPaused) {
        this.time.delayedCall(500, () => this.processSpawnQueue());
        return;
    }
    
    if (this.spawnQueue.length === 0) { 
        this.isSpawningFinished = true; 
        return; 
    }
    
    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    const step = this.spawnQueue[0]; // Olha para o próximo passo sem tirar da fila

    // --- LÓGICA DE ESPERA DE TELA LIMPA ---
    if (step.type === 'wait_clear') {
        const activeEnemies = this.flickers.countActive(true) + 
                              this.mushrooms.countActive(true) + 
                              this.bees.countActive(true) + 
                              this.oranges.countActive(true) +
                              this.fairies.countActive(true);
        if (activeEnemies > 0) {
            // Se ainda tem inimigo, tenta de novo em meio segundo
            this.time.delayedCall(500, () => this.processSpawnQueue());
            return;
        } else {
            // Tela limpa! Remove o 'wait_clear' da fila e avança para o próximo inimigo IMEDIATAMENTE
            this.spawnQueue.shift();
            // CORREÇÃO: Usamos um pequeno delay de 10ms apenas para garantir que a pilha de chamadas limpe
            // e não dispare dois processos de spawn ao mesmo tempo.
            this.time.delayedCall(10, () => this.processSpawnQueue());
            return;
        }
    }

    // --- LÓGICA DE SPAWN ---
    this.spawnQueue.shift(); // Remove o monstro da fila
    this.updateRoundHUD(); // Atualiza a barra de progresso do round
    const type = step.type; 
    const w = 1920; const h = 1080;
    
    switch (type) {
        case 'flicker':
            // Se o step tiver x e y, usa eles. Se não, sorteia.
            const fx = step.x || Phaser.Math.Between(w + 100, w + 800);
            const fy = step.y || Phaser.Math.Between(100, h - 200);
            const f = new Flicker(this, fx, fy);
            // Após a introducao do Flicker evoluido (R5), mantem padrao evoluido.
            if (step.upgraded || this.currentRound >= 5) f.upgrade();
            this.flickers.add(f);
            break;
        case 'mushroom':
            const mx = (Phaser.Math.Between(0, 1) === 0) ? -200 : w + 200;
            const m = new Mushroom(this, mx, h - 100);
            // Agora respeita se o script pediu a versão evoluída
            if (step.upgraded || this.currentRound > 3) m.upgrade();
            this.mushrooms.add(m);
            this.physics.add.collider(m, this.ground);
            break;
        case 'bee':
            const b = new Bee(this, w + 100, Phaser.Math.Between(100, h - 300));
            // A Bee evoluida entra no R6; depois disso, priorizamos sempre versao evoluida.
            if (step.upgraded || this.currentRound >= 6) b.upgrade();
            this.bees.add(b);
            break;
        case 'orange':
            // Se o roteiro não mandar um X específico, sorteia entre esquerda (-500) e direita (w + 500)
            const ox = step.x !== undefined ? step.x : ((Phaser.Math.Between(0, 1) === 0) ? -500 : w + 500);
            const oy = step.y !== undefined ? step.y : h - 180;
            const o = new Orange(this, ox, oy); 
            
            // Caso o Orange tenha uma função de upgrade no futuro, já deixamos preparado
            if (step.upgraded && typeof o.upgrade === 'function') o.upgrade();
            
            this.oranges.add(o); 
            this.physics.add.collider(o, this.ground); 
            break;
        case 'fairy':
            const frx = step.x !== undefined ? step.x : w + 200;
            const fry = step.y !== undefined ? step.y : Phaser.Math.Between(120, h - 280);
            const fairy = new Fairy(this, frx, fry);
            // Fairy normal por padrao; so evolui quando o script pedir explicitamente.
            if (step.upgraded) fairy.upgrade();
            this.fairies.add(fairy);
            break;
        case 'red_coin':
            this.redCoins.add(new RedCoin(this, w + 200, Phaser.Math.Between(200, h - 300)));
            break;
        
        // --- NOVO SISTEMA DE MOEDAS ---
        case 'blue_coin': 
            // Usa 'this.coins' que é o grupo preparado para as Blue Coins com mecânica de escudo
            this.coins.add(new BlueCoin(this, w + 200, h / 2)); 
            break;
        case 'gold_coin':
            // Se o script mandar um Y específico, usamos ele. Se não, sorteia como antes.
            const gcy = step.y || Phaser.Math.Between(200, h - 300);
            this.goldCoins.add(new GoldCoin(this, w + 200, gcy)); 
            break;
            
        // Mantém 'coin' para retrocompatibilidade com os rounds antigos (4 a 10) que não foram roteirizados ainda
        case 'coin': 
            const cy = step.y || Phaser.Math.Between(200, h - 300);
            this.goldCoins.add(new GoldCoin(this, w + 200, cy)); 
            break;
    }

    // Calcula o tempo até o próximo spawn
    const currentDelay = (step.delay !== undefined) ? step.delay : (recipe ? recipe.spawnDelay : 3000);
    this.time.delayedCall(currentDelay, () => this.processSpawnQueue());
  }

  checkRoundEnd() {
    if (this.isSpawningFinished && !this.isRoundTransitioning) {
    if (this.flickers.countActive(true) + this.mushrooms.countActive(true) + this.bees.countActive(true) + this.oranges.countActive(true) + this.fairies.countActive(true) === 0) {
            
            // Adiciona uma Blue Coin no final do Round 7
            if (this.currentRound === 7) {
                const w = 1920; const h = 1080;
                this.coins.add(new BlueCoin(this, w + 200, h / 2));
            }

            this.isRoundTransitioning = true; 
            this.playSfx('round_clear', { volume: 0.95 });
            
            // FADE OUT DA BARRA DE ROUND
            this.tweens.add({
                targets: [this.roundBarBg, this.roundBarFill, this.roundHeaderText],
                alpha: 0,
                duration: 500,
                ease: 'Linear'
            });
            
            this.time.delayedCall(3000, () => { 
                const nextRound = this.currentRound + 1;
                if (nextRound <= this.roundRecipes.length) {
                    this.saveCheckpoint(nextRound);
                }
                this.currentRound = nextRound;
                
                // Trava de Transição de Fases (Tarefa 3)
                if (this.currentRound > this.roundRecipes.length) {
                    this.goToPhase2();
                } else {
                    this.startRound(); 
                }
            });
        }
    }
  }

  startTransitionToPhase2(birdData) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      const w = 1920; const h = 1080;
      this.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0).setDepth(999);
      this.add.text(w / 2, h / 2, 'FASE 2', { fontSize: '80px', fontFamily: 'KenneyRocket', fill: '#fff' }).setOrigin(0.5).setDepth(1000);
      this.time.delayedCall(2000, () => { this.scene.start('Phase2Scene', birdData); });
    });
  }

  debugSkipRound() {
    this.spawnQueue = []; this.isSpawningFinished = true;
        this.flickers.getChildren().forEach(f => f.die()); this.mushrooms.getChildren().forEach(m => m.die()); this.bees.getChildren().forEach(b => b.die()); this.oranges.getChildren().forEach(o => o.die()); this.fairies.getChildren().forEach(f => f.die()); this.enemyProjectiles.getChildren().forEach(p => p.destroy());
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // Sistema Global de Mute (Tecla M)
    if (this.muteKey && Phaser.Input.Keyboard.JustDown(this.muteKey)) {
        this.sound.mute = !this.sound.mute;
    }

    if (this.pauseKey && Phaser.Input.Keyboard.JustDown(this.pauseKey)) this.togglePause();
    if (this.isPaused) return;
    if (this.bird && this.bird.isDead) { 
        if (this.bird.y > 1080 + 100 && !this.isGameOver) { 
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
    this.bgLayers.forEach(layer => { layer.sprite.tilePositionX += layer.speed * this.bgSpeedFactor; });
    if (this.bird) { if (this.isGameStarted) { this.bird.update(this.cursors); this.checkRoundEnd(); } else { this.bird.idleFloating(time); } }
    this.mushrooms.getChildren().forEach(m => m.update(this.bird, time, delta));
    this.bees.getChildren().forEach(b => b.update(this.bird));
    this.flickers.getChildren().forEach(f => f.update(this.bird));
    this.oranges.getChildren().forEach(o => o.update(this.bird, time, delta));
    this.fairies.getChildren().forEach(f => f.update(this.bird, time, delta));
    this.enemyProjectiles.getChildren().forEach(p => {
        if (p.update) p.update(time, delta);
    });
    this.coins.getChildren().forEach(c => c.update());
    this.goldCoins.getChildren().forEach(c => c.update());
    this.fruits.getChildren().forEach(f => f.update(time));
    this.poops.getChildren().forEach(p => p.update());
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
    
    // Agora desenha os corações com base no maxLives, não mais em '3' fixo
    for (let i = 0; i < maxLives; i++) {
      const heart = this.add.image(40 + (i * 45), h - 25, 'hearth').setScale(1).setDepth(500).setScrollFactor(0);
      this.hearts.push(heart);
    }
    // Força a atualização visual para mostrar cheios/vazios corretamente
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

  createHealInventoryHUD() {
    const h = 1080; const iconY = h - 30;
    this.healInvIcon = this.add.image(920, iconY, 'heal_item_icon').setScale(2).setDepth(500).setScrollFactor(0);
    this.healInvText = this.add.text(965, iconY, 'x 0', { fontSize: '48px', fontFamily: 'KenneyPixel', fill: '#0f0', stroke: '#000', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(500).setScrollFactor(0);
    
    this.events.on('updateStoredHeals', (count) => { if (this.healInvText) this.healInvText.setText('x ' + count); });
  }

  updateShieldInventoryHUD(count) { if (this.shieldInvText) this.shieldInvText.setText('x ' + count); }

  createProgressionHUD() {
    const w = 1920; const h = 1080;
    
    // SCORE no topo esquerdo (Semi-transparente para não atrapalhar a visão dos inimigos)
    this.scoreText = this.add.text(60, 60, 'SCORE: 0', { fontSize: '72px', fontFamily: 'KenneyPixel', fill: '#fff', stroke: '#000', strokeThickness: 8 }).setDepth(500).setScrollFactor(0).setAlpha(0);

    // --- HUD DE PROGRESSO DO ROUND ---
    // Posicionado à esquerda da barra de Level (que começa em w - 60 - 250 = 1610)
    const barW = 250; const barH = 30; const barX = w - 60 - barW; const barY = h - 25 - barH;
    const rBarW = 300; const rBarH = 20; const rBarX = barX - rBarW - 40; const rBarY = barY + 5;
    
    this.roundBarBg = this.add.graphics().setDepth(500).setScrollFactor(0).setAlpha(0);
    this.roundBarBg.fillStyle(0x333333, 0.6); // Transparência no fundo
    this.roundBarBg.fillRoundedRect(rBarX, rBarY, rBarW, rBarH, 10);
    this.roundBarBg.lineStyle(2, 0xffffff, 0.6); // Transparência na borda
    this.roundBarBg.strokeRoundedRect(rBarX, rBarY, rBarW, rBarH, 10);

    this.roundBarFill = this.add.graphics().setDepth(501).setScrollFactor(0).setAlpha(0);
    
    this.roundHeaderText = this.add.text(rBarX + rBarW/2, rBarY - 25, 'ROUND 1', { 
        fontSize: '20px', fontFamily: 'KenneyRocket', fill: '#ffffff'
    }).setOrigin(0.5, 0).setDepth(502).setScrollFactor(0).setAlpha(0);
    this.roundHeaderText.setAlpha(0.8); // Texto um pouco mais visível

    this.xpBarBgGraphics = this.add.graphics().setDepth(500).setScrollFactor(0);
    this.xpBarBgGraphics.fillStyle(0x333333, 0.8); this.xpBarBgGraphics.fillRoundedRect(barX, barY, barW, barH, 15);
    this.xpBarBgGraphics.lineStyle(2, 0xffffff, 1); this.xpBarBgGraphics.strokeRoundedRect(barX, barY, barW, barH, 15);
    this.xpBarGraphics = this.add.graphics().setDepth(501).setScrollFactor(0);
    const maskShape = this.add.graphics().setDepth(0).setScrollFactor(0).setVisible(false);
    maskShape.fillRoundedRect(barX, barY, barW, barH, 15);
    this.xpBarGraphics.setMask(maskShape.createGeometryMask());
    
    if (this.levelText) this.levelText.destroy(); // Limpa caso exista lixo
    
    this.levelText = this.add.text(barX + barW / 2, barY + barH / 2, 'LEVEL 1', { 
        fontSize: '18px', 
        fontFamily: 'KenneyRocket', 
        fill: '#ffffff', 
        stroke: '#000000', 
        strokeThickness: 3 
    }).setOrigin(0.5).setDepth(502).setScrollFactor(0);

    this.xpBarData = { x: barX, y: barY, w: barW, h: barH };
    this.roundBarData = { x: rBarX, y: rBarY, w: rBarW, h: rBarH }; // Armazena para o update
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
        if (!this.roundBarFill || !this.roundBarData || !this.roundHeaderText) return;

    const recipe = this.roundRecipes.find(r => r.round === this.currentRound);
    if (!recipe) return;

    // Calcula o total de entidades no round (se for scriptado ou não)
    const total = recipe.scripted ? recipe.sequence.length : 
                 (recipe.flickers + recipe.mushrooms + recipe.bees + (recipe.oranges || 0) + recipe.coins);
    
    const remaining = this.spawnQueue.length;
    const progress = Math.max(0, Math.min(1, (total - remaining) / total));

    this.roundBarFill.clear();
    this.roundBarFill.fillStyle(0x00ccff, 0.8); // Azul com leve transparência
    
    const { x, y, w, h } = this.roundBarData;
    this.roundBarFill.fillRoundedRect(x, y, w * progress, h, 10);
    this.roundHeaderText.setText(`ROUND ${this.currentRound}`);
  }

  // NOVA FUNÇÃO PARA TRANSICIONAR MANTENDO STATUS
  goToPhase2(isInstant = false) {
    const birdData = {
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

    const updatedRun = SaveService.saveCheckpoint({
        slotId: this.saveSlotId,
        currentPhase: 2,
        currentRound: 1,
        birdData
    });
    if (updatedRun && Number.isFinite(updatedRun.slotId)) {
        this.saveSlotId = updatedRun.slotId;
    }

    const phase2Payload = { ...birdData, saveSlotId: this.saveSlotId };

    if (isInstant) {
        this.scene.start('Phase2Scene', phase2Payload);
    } else {
        this.startTransitionToPhase2(phase2Payload);
    }
  }

  createPauseMenu(w, h) {
    this.pauseGroup = this.add.group();
    
    // Fundo escuro com leve transparência
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.85).setOrigin(0).setDepth(1000);
    
    // Título do Pause
    const pauseTitle = this.add.text(w / 2, 180, '- PAUSADO -', { 
        fontSize: '100px', fontFamily: 'KenneyRocket', fill: '#ffffff', stroke: '#000', strokeThickness: 10 
    }).setOrigin(0.5).setDepth(1001);
    
    // --- PAINEL DE STATUS ---
    const panelW = 1000; const panelH = 450;
    // Fundo do painel (Azul muito escuro com borda Neon)
    const statsBg = this.add.rectangle(w / 2, h / 2 + 20, panelW, panelH, 0x0d111a, 0.95).setDepth(1001).setStrokeStyle(4, 0x00aaff);
    
    // Linha divisória no meio do painel
    const line = this.add.rectangle(w / 2, h / 2 + 20, 4, panelH - 40, 0x00aaff, 0.5).setDepth(1001);

    // --- TÍTULOS DAS COLUNAS ---
    const leftTitle = this.add.text(w / 2 - 250, h / 2 - 160, 'ATRIBUTOS DO TORI', { 
        fontSize: '40px', fontFamily: 'KenneyPixel', fill: '#00aaff' 
    }).setOrigin(0.5).setDepth(1002);
    
    const rightTitle = this.add.text(w / 2 + 250, h / 2 - 160, 'CONTROLES E INVENTÁRIO', { 
        fontSize: '40px', fontFamily: 'KenneyPixel', fill: '#00aaff' 
    }).setOrigin(0.5).setDepth(1002);

    // --- TEXTOS DINÂMICOS (Serão preenchidos pelo updatePauseStats) ---
    this.statsTextLeft = this.add.text(w / 2 - 450, h / 2 - 100, '', { 
        fontSize: '38px', fontFamily: 'KenneyPixel', fill: '#ffffff', lineSpacing: 20 
    }).setDepth(1002);

    this.statsTextRight = this.add.text(w / 2 + 50, h / 2 - 100, '', { 
        fontSize: '38px', fontFamily: 'KenneyPixel', fill: '#ffffff', lineSpacing: 20 
    }).setDepth(1002);

    // Ícones do inventário alinhados com as linhas de texto de Escudo e Cura
    this.pauseShieldIcon = this.add.image(w / 2 + 420, h / 2 + 152, 'shield_item_icon').setScale(1.5).setDepth(1002);
    this.pauseHealIcon = this.add.image(w / 2 + 420, h / 2 + 210, 'heal_item_icon').setScale(1.5).setDepth(1002);

    // --- BOTÕES (Com visual mais moderno) ---
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

    // Eventos dos botões
    resumeBtn.on('pointerdown', () => this.togglePause());
        restartBtn.on('pointerdown', () => { this.restartCurrentRoundFromPause(); });
    homeBtn.on('pointerdown', () => { window.location.reload(); });
  }

    restartCurrentRoundFromPause() {
        const checkpointRound = Phaser.Math.Clamp(
            Math.floor(this.currentRound || 1),
            1,
            this.roundRecipes.length
        );

        this.saveCheckpoint(checkpointRound);

        const run = this.resolveRunForPauseRestart(checkpointRound);
        if (!run || !run.birdData) return;

        this.cleanupForRoundRestart();
        this.scene.start('Phase1Scene', { continueData: run, saveSlotId: run.slotId });
    }

    resolveRunForPauseRestart(targetRound) {
        const slotFromContinue = this.continueData && Number.isFinite(this.continueData.slotId)
            ? Math.floor(this.continueData.slotId)
            : null;

        let run = Number.isFinite(this.saveSlotId) ? SaveService.loadRun(this.saveSlotId) : null;
        if (!run && Number.isFinite(slotFromContinue)) {
            run = SaveService.loadRun(slotFromContinue);
        }

        if (!run) {
            const recentRuns = SaveService.loadRecentRuns(3);
            run = recentRuns.find((r) => r.currentPhase === 1) || null;
        }

        if (!run || !run.birdData) {
            const birdData = this.getBirdSaveData();
            if (!birdData) return null;

            const createdRun = SaveService.saveCheckpoint({
                slotId: Number.isFinite(this.saveSlotId) ? this.saveSlotId : slotFromContinue,
                currentPhase: 1,
                currentRound: targetRound,
                birdData
            });

            if (!createdRun || !createdRun.birdData) return null;
            if (Number.isFinite(createdRun.slotId)) this.saveSlotId = createdRun.slotId;

            return {
                ...createdRun,
                currentPhase: 1,
                currentRound: targetRound,
                slotId: createdRun.slotId
            };
        }

        const normalizedRun = {
            ...run,
            currentPhase: 1,
            currentRound: targetRound,
            slotId: run.slotId
        };

        SaveService.saveCheckpoint({
            slotId: normalizedRun.slotId,
            currentPhase: 1,
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

        if (this.pauseGroup) this.pauseGroup.setVisible(false);

        this.physics.resume();
        this.anims.resumeAll();
        this.tweens.killAll();
        this.time.removeAllEvents();

        if (this.bgmPause) this.bgmPause.stop();
        if (this.bgmPhase1) this.bgmPhase1.stop();
        if (this.bgmPhase1Music2) this.bgmPhase1Music2.stop();
    }

  updatePauseStats() {
    if (!this.bird) return;
    const dashDmg = this.bird.getDashDamage();
    const poopDmg = this.bird.getShootDamage();
    const levelLabel = this.bird.level >= 10 ? 'MAX' : this.bird.level;

    // Obtém as teclas do perfil selecionado
    const controlScheme = SettingsService.getControlScheme();
    const displayKeys = InputProfileService.getDisplayKeysForProfile(controlScheme);

    // Montando a Coluna da Esquerda
    const leftText = 
        `NÍVEL ATUAL: ${levelLabel}\n` +
        `PONTUAÇÃO: ${this.bird.score}\n` +
        `VIDAS: ${this.bird.lives} / ${this.bird.maxLives}\n\n` +
        `DANO DO DASH: ${dashDmg}\n` +
        `DANO DO COCO: ${poopDmg}\n` +
        `MUNIÇÃO: ${this.bird.ammo} / ${this.bird.maxAmmo}`;
    
    // Montando a Coluna da Direita (Hotkeys) - sincronizado com o perfil
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
    this.gameOverText = this.add.text(w / 2, h / 2 - 120, 'GAME OVER', { fontSize: '150px', fontFamily: 'KenneyRocket', fill: '#f00', stroke: '#000', strokeThickness: 15 }).setOrigin(0.5).setDepth(301);
    this.gameOverHomeBtn = this.add.text(w / 2, h / 2 + 120, 'MENU PRINCIPAL', { fontSize: '58px', fontFamily: 'KenneyPixel', fill: '#fff', backgroundColor: '#444', padding: { x: 26, y: 14 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(301);
    
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

  togglePause() {
    if (!this.isGameStarted || this.isGameOver) return;
    this.isPaused = !this.isPaused;
    this.pauseGroup.setVisible(this.isPaused);
    
    if (this.isPaused) {
        this.physics.pause();
        this.anims.pauseAll(); // CONGELA TODAS AS ANIMAÇÕES
        
        // Atualiza os Stats do Tori antes de mostrar o menu
        this.updatePauseStats();

        [this.bgmPhase1, this.bgmPhase1Music2].forEach((track) => {
            if (track && track.isPlaying) track.pause();
        });

        if (this.bgmPause) {
            if (this.bgmPause.isPlaying) this.bgmPause.stop();
            this.bgmPause.play();
        }
    } else {
        this.physics.resume();
        this.anims.resumeAll(); // RETOMA AS ANIMAÇÕES
        if (this.bgmPause) this.bgmPause.stop();
        [this.bgmPhase1, this.bgmPhase1Music2].forEach((track) => {
            if (track && track.isPaused) track.resume();
        });
    }
  }
}
