/**
 * adventure-state-machine.js
 * Máquina de estados explícita del motor de aventura.
 * Un solo estado principal activo en todo momento.
 */

export var AdventureState = {
  BOOTING: 'BOOTING',
  LOADING: 'LOADING',
  CHARACTER_SELECT: 'CHARACTER_SELECT',
  INTRO: 'INTRO',
  EXPLORING: 'EXPLORING',
  DIALOGUE: 'DIALOGUE',
  MISSION_INTRO: 'MISSION_INTRO',
  COLLECTING: 'COLLECTING',
  CHALLENGE_LOADING: 'CHALLENGE_LOADING',
  CHALLENGE: 'CHALLENGE',
  CHALLENGE_RESULT: 'CHALLENGE_RESULT',
  MISSION_COMPLETE: 'MISSION_COMPLETE',
  PAUSED: 'PAUSED',
  RETURNING: 'RETURNING',
  ERROR: 'ERROR',
  DESTROYED: 'DESTROYED'
};

var STATE_HIERARCHY = {
  DIALOGUE: ['EXPLORING'],
  MISSION_INTRO: ['EXPLORING'],
  COLLECTING: ['EXPLORING'],
  CHALLENGE_LOADING: ['EXPLORING', 'COLLECTING', 'MISSION_INTRO'],
  CHALLENGE: ['CHALLENGE_LOADING'],
  CHALLENGE_RESULT: ['CHALLENGE'],
  MISSION_COMPLETE: ['CHALLENGE_RESULT', 'EXPLORING'],
  PAUSED: ['EXPLORING', 'DIALOGUE', 'COLLECTING', 'MISSION_INTRO'],
  RETURNING: ['CHALLENGE', 'CHALLENGE_RESULT', 'MISSION_COMPLETE'],
  ERROR: ['*']
};

export function createStateMachine(initialState) {
  var current = initialState || AdventureState.BOOTING;
  var previous = null;
  var subscribers = [];

  function canTransition(next) {
    if (current === AdventureState.DESTROYED) return false;
    if (next === current) return false;
    if (next === AdventureState.ERROR) return true;
    if (next === AdventureState.DESTROYED) return true;
    var allowed = STATE_HIERARCHY[next];
    if (!allowed) return true;
    if (allowed.indexOf('*') >= 0) return true;
    return allowed.indexOf(current) >= 0;
  }

  return {
    getState: function () { return current; },
    getPrevious: function () { return previous; },
    canTransition: canTransition,
    transition: function (next, detail) {
      if (!canTransition(next)) {
        return false;
      }
      previous = current;
      current = next;
      subscribers.forEach(function (fn) {
        try { fn(current, previous, detail || null); } catch (e) { /* noop */ }
      });
      return true;
    },
    subscribe: function (fn) {
      subscribers.push(fn);
      return function () {
        var idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },
    is: function (state) { return current === state; }
  };
}
