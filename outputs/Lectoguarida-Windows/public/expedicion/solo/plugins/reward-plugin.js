/**
 * reward-plugin.js
 * Plugin que maneja recompensas al completar rondas o el juego.
 */

var RewardPlugin = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var rewardManager = options.rewardManager;

    function init(context) {}
    function start() {}
    function pause() {}
    function resume() {}
    function destroy() {}
    function onRoundComplete(correct) {
      if (correct && rewardManager) {
        rewardManager.awardLostPages(1);
      }
    }

    return { init: init, start: start, pause: pause, resume: resume, destroy: destroy, onRoundComplete: onRoundComplete };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RewardPlugin };
}
if (typeof window !== 'undefined') {
  window.RewardPlugin = RewardPlugin;
}
