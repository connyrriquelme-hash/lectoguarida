import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { pathToFileURL } from 'url';

const SOLO = pathJoin(process.cwd(), 'public', 'expedicion', 'solo');
function mp(rel) { return pathToFileURL(pathJoin(SOLO, rel)).href; }

describe('adventure-entry quality manager integration', () => {
  it('adventure-entry.js imports createQualityManager', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    assert.ok(
      src.includes("import { createQualityManager } from './quality-manager.js'"),
      'adventure-entry.js must import createQualityManager'
    );
  });

  it('adventure-entry.js uses createQualityManager before calling createWorldScene', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    assert.ok(
      src.includes('var quality = createQualityManager({ force:'),
      'adventure-entry.js must create a quality manager instance'
    );
    assert.ok(
      src.includes('createWorldScene(container, quality)'),
      'adventure-entry.js must pass quality manager (not plain object) to createWorldScene'
    );
  });

  it('quality-manager.js createQualityManager returns object with getConfig()', async () => {
    const qm = await import(mp('adventure/quality-manager.js'));
    const quality = qm.createQualityManager({ force: 'HIGH' });
    assert.ok(typeof quality.getConfig === 'function', 'getConfig must be a function');
    assert.ok(typeof quality.getTier === 'function', 'getTier must be a function');
    assert.ok(typeof quality.getMaxParticles === 'function', 'getMaxParticles must be a function');
    assert.ok(typeof quality.isAnimationEnabled === 'function', 'isAnimationEnabled must be a function');
  });

  it('quality manager getConfig() returns object with required fields for world-scene', async () => {
    const qm = await import(mp('adventure/quality-manager.js'));
    const quality = qm.createQualityManager({ force: 'HIGH' });
    const config = quality.getConfig();
    assert.ok(config.tier, 'config must have tier');
    assert.ok(typeof config.maxPixelRatio === 'number', 'config must have maxPixelRatio');
    assert.ok(typeof config.shadowsEnabled === 'boolean', 'config must have shadowsEnabled');
    assert.ok(typeof config.shadowMapSize === 'number', 'config must have shadowMapSize');
    assert.ok(typeof config.vegitationCount === 'number', 'config must have vegitationCount');
    assert.ok(typeof config.maxParticles === 'number', 'config must have maxParticles');
  });

  it('quality manager with force: HIGH produces HIGH tier', async () => {
    const qm = await import(mp('adventure/quality-manager.js'));
    const quality = qm.createQualityManager({ force: 'HIGH' });
    assert.equal(quality.getTier(), 'HIGH');
    assert.equal(quality.getConfig().tier, 'HIGH');
    assert.equal(quality.getConfig().shadowsEnabled, true);
    assert.equal(quality.getMaxParticles(), 300);
  });

  it('quality manager with force: LOW produces LOW tier', async () => {
    const qm = await import(mp('adventure/quality-manager.js'));
    const quality = qm.createQualityManager({ force: 'LOW' });
    assert.equal(quality.getTier(), 'LOW');
    assert.equal(quality.getConfig().shadowsEnabled, false);
    assert.equal(quality.getMaxParticles(), 50);
  });

  it('plain object { force: "high" } does NOT have getConfig — confirming the bug', async () => {
    const plainObj = { force: 'high' };
    assert.equal(typeof plainObj.getConfig, 'undefined', 'plain object must not have getConfig');
  });

  it('adventure-entry.js does not pass plain object to createWorldScene', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    assert.ok(
      !src.includes("createWorldScene(container, { force:"),
      'adventure-entry.js must NOT pass plain { force: ... } to createWorldScene'
    );
  });

  it('adventure-entry.js creates worldScene BEFORE createGameEngineV2', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    var worldSceneIdx = src.indexOf('createWorldScene(container, quality)');
    var engineIdx = src.indexOf('createGameEngineV2({');
    assert.ok(worldSceneIdx > 0, 'worldScene creation must exist');
    assert.ok(engineIdx > 0, 'createGameEngineV2 call must exist');
    assert.ok(worldSceneIdx < engineIdx, 'worldScene must be created BEFORE createGameEngineV2');
  });

  it('adventure-entry.js passes worldScene as deps.world to createGameEngineV2', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    assert.ok(
      src.includes('world: worldScene'),
      'adventure-entry.js must pass worldScene as deps.world'
    );
  });

  it('adventure-entry.js uses worldScene.getThree() instead of dynamic import .default', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    assert.ok(
      src.includes('worldScene.getThree()'),
      'adventure-entry.js must use worldScene.getThree()'
    );
    assert.ok(
      !src.includes(".default"),
      'adventure-entry.js must NOT use .default from dynamic import (Three.js has no default export)'
    );
  });

  it('adventure-entry.js calls worldScene.start() after engine starts', async () => {
    const src = readFileSync(pathJoin(SOLO, 'adventure', 'adventure-entry.js'), 'utf8');
    var startEngineIdx = src.indexOf('V2_ENGINE_INSTANCE.start()');
    var worldStartIdx = src.indexOf('worldScene.start()');
    assert.ok(startEngineIdx > 0, 'engine start must exist');
    assert.ok(worldStartIdx > 0, 'worldScene.start() must exist');
    assert.ok(worldStartIdx > startEngineIdx, 'worldScene.start() must be called AFTER engine start');
  });

  it('engine-v2-entry.js passes deps.world to createGameEngine', async () => {
    const src = readFileSync(pathJoin(SOLO, 'game-engine', 'engine-v2-entry.js'), 'utf8');
    assert.ok(
      src.includes('world: deps.world'),
      'engine-v2-entry.js must pass deps.world to createGameEngine'
    );
  });

  it('engine-v2-entry.js does NOT use options.world (was always undefined)', async () => {
    const src = readFileSync(pathJoin(SOLO, 'game-engine', 'engine-v2-entry.js'), 'utf8');
    assert.ok(
      !src.includes('options.world'),
      'engine-v2-entry.js must NOT reference options.world'
    );
  });
});
