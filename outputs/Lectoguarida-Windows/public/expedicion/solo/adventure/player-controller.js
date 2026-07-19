/**
 * player-controller.js
 * Mueve al jugador con aceleración suave, colisiones simples, límites,
 * movimiento relativo a cámara y destino por clic.
 */

export function createPlayerController(player, cameraController) {
  var velocity = { x: 0, z: 0 };
  var speed = 6;
  var accel = 30;
  var enabled = true;
  var waterRadius = 11;
  var waterCenter = { x: 0, z: -26 };
  var clickDestination = null;
  var clickThreshold = 0.5;

  function setEnabled(v) {
    enabled = v;
    if (!v) { velocity.x = 0; velocity.z = 0; clickDestination = null; }
  }
  function isEnabled() { return enabled; }

  function move(dir, dt) {
    if (!enabled) return;
    var targetX = dir.x * speed;
    var targetZ = dir.z * speed;
    velocity.x += (targetX - velocity.x) * Math.min(1, accel * dt);
    velocity.z += (targetZ - velocity.z) * Math.min(1, accel * dt);

    applyVelocity(dt);
  }

  function moveTowardDestination(dt) {
    if (!enabled || !clickDestination) return false;
    var dx = clickDestination.x - player.position.x;
    var dz = clickDestination.z - player.position.z;
    var dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < clickThreshold) {
      clickDestination = null;
      velocity.x = 0;
      velocity.z = 0;
      return false;
    }
    var nx = dx / dist;
    var nz = dz / dist;
    velocity.x += (nx * speed - velocity.x) * Math.min(1, accel * dt);
    velocity.z += (nz * speed - velocity.z) * Math.min(1, accel * dt);
    applyVelocity(dt);
    return true;
  }

  function applyVelocity(dt) {
    var nx = player.position.x + velocity.x * dt;
    var nz = player.position.z + velocity.z * dt;

    var dxw = nx - waterCenter.x;
    var dzw = nz - waterCenter.z;
    if (Math.sqrt(dxw * dxw + dzw * dzw) < waterRadius) {
      velocity.x = 0; velocity.z = 0;
      clickDestination = null;
      return;
    }

    nx = Math.max(-55, Math.min(55, nx));
    nz = Math.max(-55, Math.min(55, nz));

    player.position.x = nx;
    player.position.z = nz;

    if (velocity.x !== 0 || velocity.z !== 0) {
      var angle = Math.atan2(velocity.x, velocity.z);
      player.rotation.y = angle;
    }
  }

  function update(dt) {
    if (!enabled) return false;
    var moving = Math.abs(velocity.x) > 0.1 || Math.abs(velocity.z) > 0.1;
    return moving;
  }

  function teleport(x, z) {
    player.position.x = x;
    player.position.z = z;
    velocity.x = 0; velocity.z = 0;
    clickDestination = null;
  }

  function setClickDestination(dest) {
    clickDestination = dest ? { x: dest.x, z: dest.z } : null;
  }

  function getClickDestination() { return clickDestination; }

  return {
    move: move,
    moveTowardDestination: moveTowardDestination,
    update: update,
    setEnabled: setEnabled,
    isEnabled: isEnabled,
    teleport: teleport,
    getVelocity: function () { return velocity; },
    setClickDestination: setClickDestination,
    getClickDestination: getClickDestination
  };
}
