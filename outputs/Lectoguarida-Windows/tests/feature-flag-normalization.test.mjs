import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { pathToFileURL } from 'url';

const SOLO = pathJoin(process.cwd(), 'public', 'expedicion', 'solo');
function mp(rel) { return pathToFileURL(pathJoin(SOLO, rel)).href; }

describe('feature-flag normalization', () => {
  let featureFlag;
  let learningFlag;

  it('loads feature-flag.js', async () => {
    featureFlag = await import(mp('game-engine/core/feature-flag.js'));
    assert.ok(featureFlag.isGameEngineV2Enabled);
    assert.ok(featureFlag.normalizeSearchParams);
  });

  it('loads learning-feature-flag.js', async () => {
    learningFlag = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.ok(learningFlag.isLearningV1Enabled);
    assert.ok(learningFlag.isDebugLearningEnabled);
  });

  describe('normalizeSearchParams accepts all input types', () => {
    it('URLSearchParams instance', () => {
      const input = new URLSearchParams('engineV2=1');
      const result = featureFlag.normalizeSearchParams(input);
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), '1');
    });

    it('string ?engineV2=1', () => {
      const result = featureFlag.normalizeSearchParams('?engineV2=1');
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), '1');
    });

    it('Location-like object { search: "?engineV2=1" }', () => {
      const result = featureFlag.normalizeSearchParams({ search: '?engineV2=1' });
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), '1');
    });

    it('URL object with searchParams', () => {
      const url = new URL('https://example.com/?engineV2=1');
      const result = featureFlag.normalizeSearchParams(url);
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), '1');
    });

    it('undefined returns empty params', () => {
      const result = featureFlag.normalizeSearchParams(undefined);
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), null);
    });

    it('null returns empty params', () => {
      const result = featureFlag.normalizeSearchParams(null);
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), null);
    });

    it('empty object returns empty params', () => {
      const result = featureFlag.normalizeSearchParams({});
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), null);
    });

    it('object with non-functional get returns empty params', () => {
      const result = featureFlag.normalizeSearchParams({ get: 'not-a-function' });
      assert.ok(result instanceof URLSearchParams);
      assert.equal(result.get('engineV2'), null);
    });
  });

  describe('isGameEngineV2Enabled edge cases', () => {
    it('no parameters returns false', () => {
      assert.equal(featureFlag.isGameEngineV2Enabled(undefined), false);
    });

    it('?engineV2=1 returns true', () => {
      assert.equal(featureFlag.isGameEngineV2Enabled('?engineV2=1'), true);
    });

    it('string ?engineV2=1 does not throw TypeError', () => {
      assert.doesNotThrow(() => featureFlag.isGameEngineV2Enabled('?engineV2=1'));
    });

    it('engineV2 absent returns false', () => {
      assert.equal(featureFlag.isGameEngineV2Enabled('?other=1'), false);
    });

    it('engineV2=2 returns false', () => {
      assert.equal(featureFlag.isGameEngineV2Enabled('?engineV2=2'), false);
    });

    it('debugEngine=1 returns true', () => {
      assert.equal(featureFlag.isGameEngineV2Enabled('?debugEngine=1'), true);
    });
  });

  describe('isLearningV1Enabled edge cases', () => {
    it('no parameters returns false', () => {
      assert.equal(learningFlag.isLearningV1Enabled(undefined), false);
    });

    it('learningV1 without engineV2 returns false', () => {
      assert.equal(learningFlag.isLearningV1Enabled('?learningV1=1'), false);
    });

    it('engineV2 without learningV1 returns false', () => {
      assert.equal(learningFlag.isLearningV1Enabled('?engineV2=1'), false);
    });

    it('engineV2=1 + learningV1=1 returns true', () => {
      assert.equal(learningFlag.isLearningV1Enabled('?engineV2=1&learningV1=1'), true);
    });

    it('string input does not throw TypeError', () => {
      assert.doesNotThrow(() => learningFlag.isLearningV1Enabled('?engineV2=1&learningV1=1'));
    });

    it('URLSearchParams input works', () => {
      const params = new URLSearchParams('engineV2=1&learningV1=1');
      assert.equal(learningFlag.isLearningV1Enabled(params), true);
    });
  });

  describe('isDebugLearningEnabled edge cases', () => {
    it('no parameters returns false', () => {
      assert.equal(learningFlag.isDebugLearningEnabled(undefined), false);
    });

    it('debugLearning=1 returns true', () => {
      assert.equal(learningFlag.isDebugLearningEnabled('?debugLearning=1'), true);
    });

    it('string input does not throw TypeError', () => {
      assert.doesNotThrow(() => learningFlag.isDebugLearningEnabled('?debugLearning=1'));
    });
  });

  describe('mountAdventure call site contract', () => {
    it('isGameEngineV2Enabled accepts the form sent by adventure-entry', () => {
      const locationSearch = '?engineV2=1&learningV1=1';
      assert.doesNotThrow(() => featureFlag.isGameEngineV2Enabled(locationSearch));
      assert.equal(featureFlag.isGameEngineV2Enabled(locationSearch), true);
    });

    it('legacy mode does not activate Engine V2', () => {
      assert.equal(featureFlag.isGameEngineV2Enabled(''), false);
      assert.equal(featureFlag.isGameEngineV2Enabled(undefined), false);
    });
  });
});
