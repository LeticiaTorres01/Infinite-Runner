/**
 * InputProfileService.js
 * Define e materializa perfis de controle (Arrows, WASD, Vim-like).
 * Cada perfil mapeia movimento + ações para esquemas de teclas ergonômicos.
 */

export class InputProfileService {
  /**
   * Perfil de controles com mapeamento de teclas por esquema.
   * Cada perfil define: movimento (up/down/left/right), shoot, dash, shield, heal, pause.
   */
  static PROFILES = {
    arrows: {
      name: 'Setinhas',
      movement: {
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT
      },
      shoot: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.D,
      shield: Phaser.Input.Keyboard.KeyCodes.S,
      heal: Phaser.Input.Keyboard.KeyCodes.R,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC
    },

    wsad: {
      name: 'WSAD',
      movement: {
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      },
      shoot: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.PERIOD,
      shield: Phaser.Input.Keyboard.KeyCodes.Q,
      heal: Phaser.Input.Keyboard.KeyCodes.E,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC
    },

    vim: {
      name: 'Vim-like (HJKL)',
      movement: {
        left: Phaser.Input.Keyboard.KeyCodes.H,
        down: Phaser.Input.Keyboard.KeyCodes.J,
        up: Phaser.Input.Keyboard.KeyCodes.K,
        right: Phaser.Input.Keyboard.KeyCodes.L
      },
      shoot: Phaser.Input.Keyboard.KeyCodes.SPACE,
      dash: Phaser.Input.Keyboard.KeyCodes.D,
      shield: Phaser.Input.Keyboard.KeyCodes.S,
      heal: Phaser.Input.Keyboard.KeyCodes.R,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC
    }
  };

  static PROFILE_NAMES = ['arrows', 'wsad', 'vim'];

  /**
   * Cria objeto de bindings de controle a partir de um perfil nomeado.
   * Retorna estrutura compatível com Bird.update() e cenas de Phase.
   *
   * @param {Phaser.Scene} scene - cena Phaser com system de input
   * @param {string} profileName - 'arrows' | 'wsad' | 'vim'
   * @returns {Object} objeto com estrutura: { cursors, shoot, dash, shield, heal, pause }
   */
  static createInputBindings(scene, profileName) {
    const profile = this.PROFILES[profileName];
    if (!profile) {
      console.warn(`[InputProfileService] Perfil desconhecido '${profileName}', usando 'arrows'`);
      return this.createInputBindings(scene, 'arrows');
    }

    const keyboard = scene.input.keyboard;

    // Criar objeto cursors compatível com Phaser padrão
    const cursors = {
      up: keyboard.addKey(profile.movement.up),
      down: keyboard.addKey(profile.movement.down),
      left: keyboard.addKey(profile.movement.left),
      right: keyboard.addKey(profile.movement.right)
    };

    return {
      cursors,
      shoot: keyboard.addKey(profile.shoot),
      dash: keyboard.addKey(profile.dash),
      shield: keyboard.addKey(profile.shield),
      heal: keyboard.addKey(profile.heal),
      pause: keyboard.addKey(profile.pause)
    };
  }

  /**
   * Retorna nome legível do perfil.
   * @param {string} profileName - 'arrows' | 'wsad' | 'vim'
   * @returns {string} ex.: "Setinhas", "WSAD", "Vim-like (HJKL)"
   */
  static getProfileDisplayName(profileName) {
    const profile = this.PROFILES[profileName];
    return profile ? profile.name : 'Desconhecido';
  }

  /**
   * Retorna lista de todos os nomes de perfis disponíveis.
   * @returns {string[]} ['arrows', 'wsad', 'vim']
   */
  static getAvailableProfiles() {
    return [...this.PROFILE_NAMES];
  }

  /**
   * Valida se um nome de perfil é válido.
   * @param {string} profileName
   * @returns {boolean}
   */
  static isValidProfile(profileName) {
    return this.PROFILE_NAMES.includes(profileName);
  }

  /**
   * Retorna descrição textual do mapeamento de um perfil (para debugging/UI).
   * @param {string} profileName
   * @returns {string} descrição legível
   */
  static getProfileDescription(profileName) {
    const profile = this.PROFILES[profileName];
    if (!profile) return 'Perfil desconhecido';

    const mov = profile.movement;
    const movKeys = `${Object.values(mov).map(kc => this._keyCodeToString(kc)).join('/')}`;
    const actionKeys = `Shoot: ${this._keyCodeToString(profile.shoot)}, Dash: ${this._keyCodeToString(profile.dash)}, Shield: ${this._keyCodeToString(profile.shield)}, Heal: ${this._keyCodeToString(profile.heal)}`;

    return `Movimento: ${movKeys} | Ações: ${actionKeys}`;
  }

  /**
   * Retorna formatação legível das teclas para exibição no menu de pause
   * @param {string} profileName
   * @returns {Object} com descritores formatados
   */
  static getDisplayKeysForProfile(profileName) {
    const profile = this.PROFILES[profileName];
    if (!profile) return null;

    const mov = profile.movement;
    let moveLabel = 'SETAS';
    if (mov.up === Phaser.Input.Keyboard.KeyCodes.W) {
      moveLabel = 'WASD';
    } else if (mov.up === Phaser.Input.Keyboard.KeyCodes.K) {
      moveLabel = 'HJKL';
    }

    return {
      moveLabel,
      shootKey: this._keyCodeToString(profile.shoot),
      dashKey: this._keyCodeToString(profile.dash),
      shieldKey: this._keyCodeToString(profile.shield),
      healKey: this._keyCodeToString(profile.heal)
    };
  }

  /**
   * Helper para converter KeyCode para string legível (interno).
   * @private
   */
  static _keyCodeToString(keyCode) {
    const keyMap = {
      [Phaser.Input.Keyboard.KeyCodes.UP]: '↑',
      [Phaser.Input.Keyboard.KeyCodes.DOWN]: '↓',
      [Phaser.Input.Keyboard.KeyCodes.LEFT]: '←',
      [Phaser.Input.Keyboard.KeyCodes.RIGHT]: '→',
      [Phaser.Input.Keyboard.KeyCodes.W]: 'W',
      [Phaser.Input.Keyboard.KeyCodes.A]: 'A',
      [Phaser.Input.Keyboard.KeyCodes.S]: 'S',
      [Phaser.Input.Keyboard.KeyCodes.D]: 'D',
      [Phaser.Input.Keyboard.KeyCodes.H]: 'H',
      [Phaser.Input.Keyboard.KeyCodes.J]: 'J',
      [Phaser.Input.Keyboard.KeyCodes.K]: 'K',
      [Phaser.Input.Keyboard.KeyCodes.L]: 'L',
      [Phaser.Input.Keyboard.KeyCodes.SPACE]: 'SPACE',
      [Phaser.Input.Keyboard.KeyCodes.Q]: 'Q',
      [Phaser.Input.Keyboard.KeyCodes.E]: 'E',
      [Phaser.Input.Keyboard.KeyCodes.R]: 'R',
      [Phaser.Input.Keyboard.KeyCodes.PERIOD]: '.',
      [Phaser.Input.Keyboard.KeyCodes.SHIFT_LEFT]: 'SHIFT',
      [Phaser.Input.Keyboard.KeyCodes.ESC]: 'ESC'
    };

    return keyMap[keyCode] || `Key(${keyCode})`;
  }
}
