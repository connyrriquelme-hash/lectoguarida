export function normalizeWords(text = '') {
  return text
    .toLocaleLowerCase('es-CL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñü\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function normalizeAnswer(value = '') {
  return String(value).trim().toLocaleLowerCase('es-CL').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zñü0-9]/g, '');
}

export function answersMatch(value, expected) {
  return normalizeAnswer(value) === normalizeAnswer(expected);
}

export function lcsMatches(target, spoken) {
  const rows = target.length + 1;
  const cols = spoken.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      dp[i][j] = target[i - 1] === spoken[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matchedTarget = new Set();
  let i = target.length;
  let j = spoken.length;
  while (i > 0 && j > 0) {
    if (target[i - 1] === spoken[j - 1]) {
      matchedTarget.add(i - 1);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  return { count: dp[target.length][spoken.length], matchedTarget };
}

export function scoreAttempt({ reading, transcript, elapsedSeconds, warmupAnswer, comprehensionAnswer }) {
  const target = normalizeWords(reading.text);
  const spoken = normalizeWords(transcript);
  const match = lcsMatches(target, spoken);
  const correctWords = match.count;
  const accuracy = Math.round((correctWords / Math.max(target.length, 1)) * 100);
  const safeSeconds = Math.max(Number(elapsedSeconds) || 1, 10);
  const wpm = Math.round(correctWords / (safeSeconds / 60));
  const targetWpm = reading.grade === 1 ? 30 : 50;
  const paceScore = Math.min(100, Math.round((wpm / targetWpm) * 100));
  const warmup = answersMatch(warmupAnswer, reading.warmup.correct) ? 100 : 0;
  const comprehension = answersMatch(comprehensionAnswer, reading.comprehension.correct) ? 100 : 0;
  const overall = Math.round(accuracy * 0.45 + paceScore * 0.15 + warmup * 0.15 + comprehension * 0.25);
  const missed = target.filter((_, index) => !match.matchedTarget.has(index));
  const focus = [];
  if (missed.some((word) => word.includes('r'))) focus.push('Sonido R');
  if (missed.some((word) => word.includes('l'))) focus.push('Sonido L');
  if (missed.length >= 3) focus.push('Precisión de palabras');
  if (wpm < targetWpm * 0.65) focus.push('Continuidad lectora');
  if (!warmup) focus.push(reading.warmup.skill);
  if (!comprehension) focus.push('Comprensión del relato');
  if (!focus.length) focus.push('Lectura estable');
  const xp = 20 + Math.round(overall / 4);
  const coins = 5 + Math.round(overall / 10);
  const message = overall >= 85
    ? '¡Lectoguarida recuperó toda su luz!'
    : overall >= 65
      ? '¡Gran avance! Tu guardián encontró una nueva pista.'
      : 'Cada intento enciende una luz. La próxima misión traerá más ayuda.';
  return { accuracy, wpm, warmup, comprehension, overall, correctWords, totalWords: target.length, focus, xp, coins, message };
}

export function getDefaultMastery() {
  return {
    decoding: 50,
    fluency: 50,
    accuracy: 50,
    vocabulary: 50,
    literal_comprehension: 50,
    inferential_comprehension: 50,
    sequence: 50,
    prosody: 50,
    attention: 50
  };
}

export function ensureMissionFieldsForStudent(student) {
  if (!student.mastery || typeof student.mastery !== 'object') {
    student.mastery = getDefaultMastery();
  } else {
    const defaults = getDefaultMastery();
    for (const key of Object.keys(defaults)) {
      if (student.mastery[key] === undefined || student.mastery[key] === null) {
        student.mastery[key] = defaults[key];
      }
    }
  }
  if (!Array.isArray(student.unlockedZones)) student.unlockedZones = ['starter'];
  if (!Array.isArray(student.completedMissionIds)) student.completedMissionIds = [];
  if (!Array.isArray(student.recentMissionTypes)) student.recentMissionTypes = [];
  if (student.missionEngineEnabled === undefined || student.missionEngineEnabled === null) student.missionEngineEnabled = false;
  if (!Number.isFinite(Number(student.progressionVersion))) student.progressionVersion = 1;
  return student;
}

export function ensureMissionFieldsForAttempt(attempt) {
  if (attempt.missionId === undefined || attempt.missionId === null) attempt.missionId = null;
  if (attempt.missionType === undefined || attempt.missionType === null) attempt.missionType = null;
  if (!Array.isArray(attempt.focusAreas)) attempt.focusAreas = [];
  if (!attempt.assistanceUsed || typeof attempt.assistanceUsed !== 'object') attempt.assistanceUsed = {};
  if (!attempt.readingErrors || typeof attempt.readingErrors !== 'object') attempt.readingErrors = {};
  if (attempt.progressionSnapshot === undefined || attempt.progressionSnapshot === null) attempt.progressionSnapshot = null;
  return attempt;
}

if (typeof globalThis !== 'undefined') {
  globalThis.normalizeWords = normalizeWords;
  globalThis.normalizeAnswer = normalizeAnswer;
  globalThis.answersMatch = answersMatch;
  globalThis.lcsMatches = lcsMatches;
  globalThis.scoreAttempt = scoreAttempt;
  globalThis.getDefaultMastery = getDefaultMastery;
  globalThis.ensureMissionFieldsForStudent = ensureMissionFieldsForStudent;
  globalThis.ensureMissionFieldsForAttempt = ensureMissionFieldsForAttempt;
}
