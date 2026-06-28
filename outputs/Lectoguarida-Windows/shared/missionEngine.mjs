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
  
  const candidates = templates.filter(t => t.targetSkill === weakest);
  if (candidates.length === 0) return getClassicMissionFallback(student);

  // Seleccionar la que menos se ha repetido recientemente
  return candidates.sort((a, b) => {
    const countA = history.filter(type => type === a.type).length;
    const countB = history.filter(type => type === b.type).length;
    return countA - countB;
  })[0];
}

export function getClassicMissionFallback(student) {
  return { id: 'classic-fallback', type: 'karaoke_reading', targetSkill: 'fluency', difficulty: 50 };
}