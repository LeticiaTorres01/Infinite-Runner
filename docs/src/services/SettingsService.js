/**
 * SettingsService.js
 * Gerencia persistência de preferências do jogo (esquema de controles e volume master).
 * Responsabilidades: carregar/salvar em localStorage, validar padrões, aplicar defaults.
 */

export class SettingsService {
  static STORAGE_KEY = 'infinite_runner_settings';

  static DEFAULTS = {
    controlScheme: 'arrows', // 'arrows' | 'wsad' | 'vim'
    masterVolume: 50,        // 0-100
    musicVolume: 70,         // 0-100
    fxVolume: 80             // 0-100
  };

  static VALID_CONTROL_SCHEMES = ['arrows', 'wsad', 'vim'];

  /**
   * Carrega configurações do localStorage ou retorna defaults.
   * Inclui migração defensiva (valida esquema, corrige valores fora de intervalo).
   * @returns {Object} { controlScheme, masterVolume, musicVolume, fxVolume }
   */
  static loadSettings() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { ...this.DEFAULTS };
      }

      const parsed = JSON.parse(stored);
      return this._validateAndNormalize(parsed);
    } catch (error) {
      console.warn('[SettingsService] Erro ao carregar configurações, usando defaults:', error);
      return { ...this.DEFAULTS };
    }
  }

  /**
   * Salva configurações no localStorage.
   * @param {Object} settings - { controlScheme, masterVolume, musicVolume, fxVolume }
   * @returns {boolean} true se sucesso, false se falhar
   */
  static saveSettings(settings) {
    try {
      const normalized = this._validateAndNormalize(settings);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(normalized));
      return true;
    } catch (error) {
      console.error('[SettingsService] Erro ao salvar configurações:', error);
      return false;
    }
  }

  /**
   * Validator + normalizer: garante que controlScheme é válido e volumes estão em [0, 100].
   * @private
   */
  static _validateAndNormalize(settings) {
    const result = { ...this.DEFAULTS };

    if (settings.controlScheme && this.VALID_CONTROL_SCHEMES.includes(settings.controlScheme)) {
      result.controlScheme = settings.controlScheme;
    }

    if (typeof settings.masterVolume === 'number') {
      result.masterVolume = Math.max(0, Math.min(100, settings.masterVolume));
    }

    if (typeof settings.musicVolume === 'number') {
      result.musicVolume = Math.max(0, Math.min(100, settings.musicVolume));
    }

    if (typeof settings.fxVolume === 'number') {
      result.fxVolume = Math.max(0, Math.min(100, settings.fxVolume));
    }

    return result;
  }

  /**
   * Retorna esquema de controles atual.
   * @returns {string} 'arrows' | 'wsad' | 'vim'
   */
  static getControlScheme() {
    const settings = this.loadSettings();
    return settings.controlScheme;
  }

  /**
   * Define esquema de controles e persiste.
   * @param {string} scheme - 'arrows' | 'wsad' | 'vim'
   * @returns {boolean} true se sucesso
   */
  static setControlScheme(scheme) {
    const current = this.loadSettings();
    return this.saveSettings({ ...current, controlScheme: scheme });
  }

  /**
   * Retorna volume master atual (0-100).
   * @returns {number}
   */
  static getMasterVolume() {
    const settings = this.loadSettings();
    return settings.masterVolume;
  }

  /**
   * Define volume master (0-100) e persiste.
   * @param {number} volume - 0-100
   * @returns {boolean} true se sucesso
   */
  static setMasterVolume(volume) {
    const current = this.loadSettings();
    return this.saveSettings({ ...current, masterVolume: volume });
  }

  /**
   * Retorna volume de música atual (0-100).
   * @returns {number}
   */
  static getMusicVolume() {
    const settings = this.loadSettings();
    return settings.musicVolume;
  }

  /**
   * Define volume de música (0-100) e persiste.
   * @param {number} volume - 0-100
   * @returns {boolean} true se sucesso
   */
  static setMusicVolume(volume) {
    const current = this.loadSettings();
    return this.saveSettings({ ...current, musicVolume: volume });
  }

  /**
   * Retorna volume de efeitos sonoros atual (0-100).
   * @returns {number}
   */
  static getFxVolume() {
    const settings = this.loadSettings();
    return settings.fxVolume;
  }

  /**
   * Define volume de efeitos sonoros (0-100) e persiste.
   * @param {number} volume - 0-100
   * @returns {boolean} true se sucesso
   */
  static setFxVolume(volume) {
    const current = this.loadSettings();
    return this.saveSettings({ ...current, fxVolume: volume });
  }

  /**
   * Reseta configurações para defaults.
   * @returns {boolean} true se sucesso
   */
  static resetToDefaults() {
    return this.saveSettings({ ...this.DEFAULTS });
  }
}
