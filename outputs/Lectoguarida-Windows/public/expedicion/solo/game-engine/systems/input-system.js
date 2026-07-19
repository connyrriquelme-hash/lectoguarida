/**
 * input-system.js
 * Handles keyboard, joystick, click input for V2.
 */

import { COMPONENTS } from '../components/components.js';

export function createInputSystem() {
  var keys = {};
  var joystick = { x: 0, z: 0 };
  var clickPos = null;

  return {
    componentId: 'InputSystem',
    _keys: keys,
    _joystick: joystick,
    _clickPos: clickPos,

    handleKeyDown: function (key) { keys[key] = true; },
    handleKeyUp: function (key) { keys[key] = false; },
    isPressed: function (key) { return !!keys[key]; },

    setJoystick: function (x, z) { joystick.x = x; joystick.z = z; },
    getJoystick: function () { return { x: joystick.x, z: joystick.z }; },

    setClickPosition: function (pos) { clickPos = pos; },
    getClickPosition: function () { return clickPos; },

    update: function (context, delta) {
      var movement = context.componentRegistry.query(COMPONENTS.MOVEMENT);
      var dir = { x: 0, z: 0 };
      var hasInput = false;

      if (keys.KeyW || keys.ArrowUp) { dir.z -= 1; hasInput = true; }
      if (keys.KeyS || keys.ArrowDown) { dir.z += 1; hasInput = true; }
      if (keys.KeyA || keys.ArrowLeft) { dir.x -= 1; hasInput = true; }
      if (keys.KeyD || keys.ArrowRight) { dir.x += 1; hasInput = true; }

      if (!hasInput && (joystick.x !== 0 || joystick.z !== 0)) {
        dir.x = joystick.x;
        dir.z = joystick.z;
        hasInput = true;
      }

      if (hasInput) {
        for (var i = 0; i < movement.length; i++) {
          var mv = movement[i];
          if (mv.enabled) {
            mv.direction = [dir.x, 0, dir.z];
          }
        }
      } else {
        for (var j = 0; j < movement.length; j++) {
          var mv2 = movement[j];
          if (mv2.enabled) mv2.direction = [0, 0, 0];
        }
      }
    }
  };
}