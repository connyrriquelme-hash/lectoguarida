export const readingRoutes = [
  { id:'starting', name:'Estoy comenzando', icon:'🌱', help:'Más apoyo visual, letras, sílabas y frases breves.' },
  { id:'fluent', name:'Ya leo bien', icon:'🚀', help:'Fluidez, inferencias, vocabulario y desafíos tipo SIMCE.' }
];

export const adventureZones = [
  ['letters','Isla de las Letras','🔤','Conciencia fonológica y principio alfabético'],
  ['syllables','Bosque de Sílabas','🌳','Sílabas y combinaciones consonánticas'],
  ['words','Cueva de Palabras','💎','Decodificación y vocabulario'],
  ['sentences','Torre de Oraciones','🏰','Oraciones, puntuación y prosodia'],
  ['stories','Biblioteca de Cuentos','📚','Narraciones y secuencias'],
  ['comprehension','Laboratorio de Comprensión','🔎','Información explícita e implícita'],
  ['simce','Arena SIMCE','🏆','Opinión, inferencia y aplicación'],
  ['science','Misiones de Ciencias','🔬','Naturaleza, cuerpo, agua y ambiente'],
  ['history','Misiones de Historia','🧭','Comunidad, territorio y memorias'],
  ['math','Matemática Lectora','🧮','Problemas verbales y datos simples']
].map(([id,name,icon,objective])=>({id,name,icon,objective}));

export function zoneForReading(reading, stageIndex = 0) {
  if (reading.stage === 'Letras') return 'letters';
  if (reading.stage === 'Doble consonante') return 'syllables';
  if (reading.stage === 'Ciencia y ambiente') return 'science';
  if (reading.stage === 'Chile y ciudadanía' || reading.stage === 'Interculturalidad') return 'history';
  if (/número|cantidad|medir|problema|dato|tabla/i.test(`${reading.title} ${reading.skill}`)) return 'math';
  if (reading.stage === 'Fluidez') return ['words','sentences','stories'][Math.min(2,Math.floor(stageIndex/5))];
  return ['stories','comprehension','simce'][stageIndex % 3];
}

export const miniGameCatalog = [
  ['catch','Atrapa la letra correcta','🎯'],['syllables','Ordena sílabas','🧩'],['rhyme','Salta sobre la rima','🦘'],
  ['intruder','Encuentra la palabra intrusa','🕵️'],['signs','Bonus de signos','❗']
].map(([id,name,icon])=>({id,name,icon}));
