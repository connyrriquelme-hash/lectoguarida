export const skillFocus = [
  'decoding', 'fluency', 'accuracy', 'vocabulary', 
  'literal_comprehension', 'inferential_comprehension', 'sequence', 'prosody', 'attention'
];

export const missionTypes = [
  'karaoke_reading', 'word_hunt', 'sentence_order', 'inferential_detective', 
  'vocabulary_bridge', 'fluency_sprint', 'prosody_echo', 'punctuation_pause', 'boss_comprehension'
];

export const missionTemplates = Array.from({ length: 10 }, (_, i) => ({
  id: `mission-template-${i}`,
  type: missionTypes[i % missionTypes.length],
  targetSkill: skillFocus[i % skillFocus.length],
  difficulty: i * 10
}));

export function getWeakestSkill(mastery) {
  if (!mastery || typeof mastery !== 'object') return skillFocus[0];
  let weakest = skillFocus[0];
  let minVal = Infinity;
  for (const skill of skillFocus) {
    const val = mastery[skill] ?? 50;
    if (val < minVal) {
      minVal = val;
      weakest = skill;
    }
  }
  return weakest;
}

export function normalizeMissionHistory(student) {
  return Array.isArray(student.recentMissionTypes) ? student.recentMissionTypes : [];
}

export function selectNextMission(student, templates) {
  if (!student.missionEngineEnabled) return getClassicMissionFallback(student);
  
  const weakest = getWeakestSkill(student.mastery);
  const history = normalizeMissionHistory(student);
  if (!Array.isArray(templates) || !templates.length) return getClassicMissionFallback(student);

  const scored = templates.slice().sort((a, b) => {
    const scoreA = (history.includes(a.type) ? 2 : 0) + (a.targetSkill === weakest ? 1 : 0) + ((a.difficulty || 0) / 100);
    const scoreB = (history.includes(b.type) ? 2 : 0) + (b.targetSkill === weakest ? 1 : 0) + ((b.difficulty || 0) / 100);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return (a.difficulty || 0) - (b.difficulty || 0);
  });
  return scored[0] || getClassicMissionFallback(student);
}

export function getClassicMissionFallback(student) {
  return { id: 'classic-fallback', type: 'karaoke_reading', targetSkill: 'fluency', difficulty: 50 };
}

if (typeof globalThis !== 'undefined') {
  globalThis.getWeakestSkill = getWeakestSkill;
  globalThis.selectNextMission = selectNextMission;
  globalThis.missionTemplates = missionTemplates;
}
