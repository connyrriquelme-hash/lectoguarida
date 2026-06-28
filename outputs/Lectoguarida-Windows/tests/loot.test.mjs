import test from 'node:test';
import assert from 'node:assert/strict';
import { nextPityState, pickRarity, pickWeighted } from '../loot.mjs';

const table = [
  { id:'common', weight:90 },
  { id:'rare', weight:9 },
  { id:'legendary', weight:1 }
];

test('selecciona por pesos sin depender de que sumen cien', () => {
  assert.equal(pickWeighted([{ id:'a', weight:2 }, { id:'b', weight:1 }], () => 0.1).id, 'a');
  assert.equal(pickWeighted([{ id:'a', weight:2 }, { id:'b', weight:1 }], () => 0.9).id, 'b');
});

test('mantiene 90 puntos comunes y 10 especiales', () => {
  assert.equal(table.find((item) => item.id === 'common').weight, 90);
  assert.equal(table.filter((item) => item.id !== 'common').reduce((sum, item) => sum + item.weight, 0), 10);
});

test('la piedad excluye matematicamente la categoria comun', () => {
  assert.notEqual(pickRarity(table, { forceSpecial:true, random:() => 0 }), 'common');
  assert.notEqual(pickRarity(table, { forceSpecial:true, random:() => 0.999 }), 'common');
});

test('el quinto sobre activa la garantia y un especial reinicia el contador', () => {
  assert.equal(nextPityState(4, false, 5).triggered, true);
  assert.equal(nextPityState(4, false, 5).next, 5);
  assert.equal(nextPityState(4, true, 5).next, 0);
});
