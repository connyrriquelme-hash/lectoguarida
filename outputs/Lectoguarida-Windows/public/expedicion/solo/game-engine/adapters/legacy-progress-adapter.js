/**
 * legacy-progress-adapter.js
 * Bridges V2 SaveSystem to existing SoloProgressRepository.
 * Same storage, same keys — no parallel progress system.
 */

export function createLegacyProgressAdapter(options) {
  var SoloProgressRepository = options.SoloProgressRepository;
  var studentProfileId = options.studentProfileId || 'default-student';
  var readerProfile = options.readerProfile || 'non_reader';
  var destroyed = false;

  function save(data) {
    if (destroyed) return;
    if (!SoloProgressRepository) return;
    try {
      SoloProgressRepository.updateProfileProgress(studentProfileId, readerProfile, { adventure: data });
    } catch (e) {
      console.warn('[LegacyProgressAdapter] save failed', e);
    }
  }

  function load() {
    if (destroyed) return null;
    if (!SoloProgressRepository) return null;
    try {
      var p = SoloProgressRepository.getProfileProgress(studentProfileId, readerProfile);
      return p && p.adventure ? p.adventure : null;
    } catch (e) {
      console.warn('[LegacyProgressAdapter] load failed', e);
      return null;
    }
  }

  function destroy() {
    destroyed = true;
  }

  return {
    save: save,
    load: load,
    destroy: destroy
  };
}