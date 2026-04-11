const SAVE_KEY = 'tori-tori-save-v1';
const SAVE_VERSION = 1;
const MAX_RUNS = 3;

function isValidBirdData(birdData) {
  if (!birdData || typeof birdData !== 'object') return false;
  return typeof birdData.level === 'number';
}

function sanitizeRound(value, fallback = 1) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function isValidPhase(value) {
  return value === 1 || value === 2;
}

function sanitizeRun(run) {
  if (!run || typeof run !== 'object') return null;
  if (!Number.isFinite(run.slotId)) return null;
  if (!isValidPhase(run.currentPhase)) return null;
  if (!isValidBirdData(run.birdData)) return null;

  return {
    slotId: Math.max(1, Math.floor(run.slotId)),
    currentPhase: run.currentPhase,
    currentRound: sanitizeRound(run.currentRound, 1),
    birdData: run.birdData,
    createdAt: Number.isFinite(run.createdAt) ? run.createdAt : Date.now(),
    updatedAt: Number.isFinite(run.updatedAt) ? run.updatedAt : Date.now()
  };
}

export default class SaveService {
  static _readStore() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { version: SAVE_VERSION, runs: [] };

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return { version: SAVE_VERSION, runs: [] };

      // Migração de versão antiga (save único).
      if (!Array.isArray(parsed.runs)) {
        if (parsed.version === SAVE_VERSION && isValidPhase(parsed.currentPhase) && isValidBirdData(parsed.birdData)) {
          const migrated = {
            slotId: 1,
            currentPhase: parsed.currentPhase,
            currentRound: sanitizeRound(parsed.currentRound, 1),
            birdData: parsed.birdData,
            createdAt: Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
            updatedAt: Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now()
          };
          return { version: SAVE_VERSION, runs: [migrated] };
        }
        return { version: SAVE_VERSION, runs: [] };
      }

      const runs = parsed.runs
        .map((run) => sanitizeRun(run))
        .filter(Boolean)
        .slice(0, MAX_RUNS);

      return { version: SAVE_VERSION, runs };
    } catch (err) {
      console.warn('SaveService: failed to read save store.', err);
      return { version: SAVE_VERSION, runs: [] };
    }
  }

  static _writeStore(store) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn('SaveService: failed to write save store.', err);
    }
  }

  static hasSave() {
    return SaveService._readStore().runs.length > 0;
  }

  static loadRecentRuns(limit = MAX_RUNS) {
    const store = SaveService._readStore();
    return [...store.runs]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, Math.max(1, Math.floor(limit)));
  }

  static loadRun(slotId) {
    if (!Number.isFinite(slotId)) return null;
    const store = SaveService._readStore();
    const run = store.runs.find((r) => r.slotId === Math.floor(slotId));
    return run ? { ...run } : null;
  }

  static createNewRun({ currentPhase = 1, currentRound = 1, birdData }) {
    if (!isValidPhase(currentPhase) || !isValidBirdData(birdData)) return null;

    const store = SaveService._readStore();
    const now = Date.now();

    let slotId = null;
    for (let i = 1; i <= MAX_RUNS; i++) {
      if (!store.runs.some((run) => run.slotId === i)) {
        slotId = i;
        break;
      }
    }

    if (!slotId) {
      const oldest = [...store.runs].sort((a, b) => a.updatedAt - b.updatedAt)[0];
      slotId = oldest ? oldest.slotId : 1;
    }

    const newRun = {
      slotId,
      currentPhase,
      currentRound: sanitizeRound(currentRound, 1),
      birdData,
      createdAt: now,
      updatedAt: now
    };

    store.runs = store.runs.filter((run) => run.slotId !== slotId);
    store.runs.push(newRun);
    SaveService._writeStore(store);
    return { ...newRun };
  }

  static createRunInSlot({ slotId, currentPhase = 1, currentRound = 1, birdData }) {
    if (!Number.isFinite(slotId) || !isValidPhase(currentPhase) || !isValidBirdData(birdData)) return null;

    const safeSlotId = Math.max(1, Math.min(MAX_RUNS, Math.floor(slotId)));
    const store = SaveService._readStore();
    const now = Date.now();

    const newRun = {
      slotId: safeSlotId,
      currentPhase,
      currentRound: sanitizeRound(currentRound, 1),
      birdData,
      createdAt: now,
      updatedAt: now
    };

    store.runs = store.runs.filter((run) => run.slotId !== safeSlotId);
    store.runs.push(newRun);
    SaveService._writeStore(store);
    return { ...newRun };
  }

  static saveCheckpoint({ slotId, currentPhase, currentRound, birdData }) {
    if (!isValidPhase(currentPhase) || !isValidBirdData(birdData)) return null;

    const store = SaveService._readStore();
    const now = Date.now();
    const safeRound = sanitizeRound(currentRound, 1);

    let run = null;
    const safeSlotId = Number.isFinite(slotId) ? Math.floor(slotId) : null;

    if (safeSlotId) {
      run = store.runs.find((item) => item.slotId === safeSlotId) || null;
    }

    if (!run) {
      if (safeSlotId) {
        return SaveService.createRunInSlot({
          slotId: safeSlotId,
          currentPhase,
          currentRound: safeRound,
          birdData
        });
      }
      return SaveService.createNewRun({ currentPhase, currentRound: safeRound, birdData });
    }

    run.currentPhase = currentPhase;
    run.currentRound = safeRound;
    run.birdData = birdData;
    run.updatedAt = now;
    SaveService._writeStore(store);
    return { ...run };
  }

  static clearRun(slotId) {
    if (!Number.isFinite(slotId)) return;
    const store = SaveService._readStore();
    store.runs = store.runs.filter((run) => run.slotId !== Math.floor(slotId));
    SaveService._writeStore(store);
  }

  static clearAll() {
    localStorage.removeItem(SAVE_KEY);
  }
}
