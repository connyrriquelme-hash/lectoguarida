export function pickWeighted(table, random = Math.random) {
  const valid = table.filter((item) => Number(item.weight) > 0);
  const totalWeight = valid.reduce((total, item) => total + Number(item.weight), 0);
  if (!totalWeight) throw new Error('La tabla de recompensas no tiene pesos validos.');
  let roll = random() * totalWeight;
  for (const item of valid) {
    roll -= Number(item.weight);
    if (roll < 0) return item;
  }
  return valid.at(-1);
}

export function pickRarity(table, { forceSpecial = false, random = Math.random } = {}) {
  const eligible = forceSpecial ? table.filter((item) => item.id !== 'common') : table;
  return pickWeighted(eligible, random).id;
}

export function nextPityState(packsSinceRare, foundSpecial, pityLimit = 5) {
  const current = Math.max(0, Number(packsSinceRare) || 0);
  return {
    triggered: current >= pityLimit - 1,
    next: foundSpecial ? 0 : current + 1
  };
}
