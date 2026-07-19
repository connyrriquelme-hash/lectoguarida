/**
 * camera-controller.js
 * Cámara de aventura en tercera persona navegable.
 * Modos: FOLLOW (seguimiento con órbita), FOCUS (enfoque puntual), OVERVIEW (vista amplia).
 * Soporta rotación con mouse/touch, zoom con rueda/pinch, recenter, colisión y oclusión.
 */

import * as THREE from './vendor/three.module.js';

var CAMERA_MODE_FOLLOW = 'FOLLOW';
var CAMERA_MODE_FOCUS = 'FOCUS';
var CAMERA_MODE_OVERVIEW = 'OVERVIEW';

var DEFAULT_YAW = Math.PI * 0.25;
var DEFAULT_PITCH = 0.75;
var DEFAULT_DISTANCE = 10;

var MIN_DISTANCE = 5;
var MAX_DISTANCE = 18;
var MIN_PITCH = 0.3;
var MAX_PITCH = 1.2;
var LOOK_AT_OFFSET_Y = 1.2;

var CAMERA_PRESETS = {
  DESKTOP_WIDE: { fov: 34, near: 0.1, far: 200 },
  DESKTOP_COMPACT: { fov: 32, near: 0.1, far: 200 },
  TABLET: { fov: 36, near: 0.1, far: 200 },
  MOBILE_PORTRAIT: { fov: 34, near: 0.1, far: 200 },
  MOBILE_LANDSCAPE: { fov: 36, near: 0.1, far: 200 }
};

function resolveCameraPreset(width, height) {
  var shorter = Math.min(width, height);
  var isLandscape = width > height;
  var isMobile = shorter < 430;
  var isTablet = !isMobile && width < 1024 && height >= 768 && width < 900;

  if (isMobile) {
    return isLandscape ? CAMERA_PRESETS.MOBILE_LANDSCAPE : CAMERA_PRESETS.MOBILE_PORTRAIT;
  }
  if (isTablet) {
    return CAMERA_PRESETS.TABLET;
  }
  if (height < 700) {
    return CAMERA_PRESETS.DESKTOP_COMPACT;
  }
  return CAMERA_PRESETS.DESKTOP_WIDE;
}

function applyPreset(camera, preset) {
  camera.fov = preset.fov;
  camera.near = preset.near;
  camera.far = preset.far;
  camera.updateProjectionMatrix();
}

function clampVal(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerpAngle(a, b, t) {
  var diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function createCameraController(camera, target) {
  var yaw = DEFAULT_YAW;
  var pitch = DEFAULT_PITCH;
  var distance = DEFAULT_DISTANCE;
  var desiredYaw = DEFAULT_YAW;
  var desiredPitch = DEFAULT_PITCH;
  var desiredDistance = DEFAULT_DISTANCE;
  var currentMode = CAMERA_MODE_FOLLOW;
  var enabled = true;
  var reducedMotion = false;
  var bounds = { minX: -55, maxX: 55, minZ: -55, maxZ: 55 };
  var focusTarget = null;
  var focusDuration = 0;
  var focusElapsed = 0;
  var smoothing = 8;

  var collisionObjects = [];
  var occluderObjects = [];
  var originalMaterials = new Map();

  var _tempVec = new THREE.Vector3();
  var _raycaster = new THREE.Raycaster();
  var _lookAtVec = new THREE.Vector3();

  try {
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* noop */ }

  function update(dt) {
    if (!target || !enabled) return;

    var sm = reducedMotion ? 1 : Math.min(1, smoothing * dt);

    if (currentMode === CAMERA_MODE_FOCUS) {
      focusElapsed += dt;
      if (focusDuration > 0 && focusElapsed >= focusDuration) {
        setMode(CAMERA_MODE_FOLLOW);
      }
    }

    var tPos = target.position;

    if (currentMode === CAMERA_MODE_OVERVIEW) {
      desiredYaw = lerpAngle(desiredYaw, DEFAULT_YAW, sm * 0.5);
      desiredPitch = clampVal(desiredPitch + 0.3 * dt, MIN_PITCH, MAX_PITCH);
      desiredDistance = clampVal(desiredDistance + 2 * dt, MIN_DISTANCE, MAX_DISTANCE);
    }

    yaw = lerpAngle(yaw, desiredYaw, sm);
    pitch = pitch + (desiredPitch - pitch) * sm;
    distance = distance + (desiredDistance - distance) * sm;

    var cosP = Math.cos(pitch);
    var sinP = Math.sin(pitch);
    var cosY = Math.cos(yaw);
    var sinY = Math.sin(yaw);

    _tempVec.set(
      tPos.x + sinY * cosP * distance,
      tPos.y + sinP * distance,
      tPos.z + cosY * cosP * distance
    );

    if (collisionObjects.length > 0) {
      _raycaster.set(tPos, _tempVec.clone().sub(tPos).normalize());
      var hits = _raycaster.intersectObjects(collisionObjects, true);
      if (hits.length > 0 && hits[0].distance < distance) {
        distance = Math.max(MIN_DISTANCE, hits[0].distance - 1);
        desiredDistance = distance;
        _tempVec.set(
          tPos.x + sinY * cosP * distance,
          tPos.y + sinP * distance,
          tPos.z + cosY * cosP * distance
        );
      }
    }

    camera.position.lerp(_tempVec, sm);
    _lookAtVec.set(tPos.x, tPos.y + LOOK_AT_OFFSET_Y, tPos.z);
    camera.lookAt(_lookAtVec);

    handleOcclusion(tPos);
  }

  function handleOcclusion(playerPos) {
    if (occluderObjects.length === 0) return;
    _raycaster.set(camera.position, playerPos.clone().sub(camera.position).normalize());
    var hits = _raycaster.intersectObjects(occluderObjects, true);
    for (var i = 0; i < occluderObjects.length; i++) {
      var obj = occluderObjects[i];
      var blocked = false;
      for (var j = 0; j < hits.length; j++) {
        if (isDescendant(hits[j].object, obj)) {
          blocked = true;
          break;
        }
      }
      if (blocked) {
        if (!originalMaterials.has(obj.uuid)) {
          originalMaterials.set(obj.uuid, obj.material);
          obj.material = obj.material.clone();
          obj.material.transparent = true;
          obj.material.opacity = 0.3;
        }
      } else if (originalMaterials.has(obj.uuid)) {
        obj.material = originalMaterials.get(obj.uuid);
        originalMaterials.delete(obj.uuid);
      }
    }
  }

  function isDescendant(child, parent) {
    var c = child;
    while (c) {
      if (c === parent) return true;
      c = c.parent;
    }
    return false;
  }

  function rotateBy(dyaw, dpitch) {
    if (!enabled || currentMode === CAMERA_MODE_FOCUS) return;
    desiredYaw += dyaw;
    desiredPitch = clampVal(desiredPitch + dpitch, MIN_PITCH, MAX_PITCH);
  }

  function zoomBy(delta) {
    if (!enabled) return;
    desiredDistance = clampVal(desiredDistance + delta, MIN_DISTANCE, MAX_DISTANCE);
  }

  function setMode(mode) {
    if (mode === currentMode) return;
    if (mode === CAMERA_MODE_FOLLOW) {
      focusTarget = null;
      focusDuration = 0;
      focusElapsed = 0;
    }
    currentMode = mode;
  }

  function focusOn(position, duration) {
    focusTarget = position ? position.clone() : null;
    focusDuration = duration || 0;
    focusElapsed = 0;
    currentMode = CAMERA_MODE_FOCUS;
  }

  function recenter() {
    desiredYaw = DEFAULT_YAW;
    desiredPitch = DEFAULT_PITCH;
    desiredDistance = DEFAULT_DISTANCE;
  }

  function setCollisionObjects(objs) { collisionObjects = objs || []; }
  function setOccluderObjects(objs) { occluderObjects = objs || []; }

  function getForwardDir() {
    return new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
  }

  function getRightDir() {
    var fwd = getForwardDir();
    return new THREE.Vector3(-fwd.z, 0, fwd.x);
  }

  function applyViewportPreset(width, height) {
    var preset = resolveCameraPreset(width, height);
    applyPreset(camera, preset);
  }

  function destroy() {
    originalMaterials.forEach(function (mat, uuid) {
      originalMaterials.delete(uuid);
    });
    collisionObjects = [];
    occluderObjects = [];
    target = null;
  }

  return {
    update: update,
    rotateBy: rotateBy,
    zoomBy: zoomBy,
    setMode: setMode,
    getMode: function () { return currentMode; },
    focusOn: focusOn,
    recenter: recenter,
    setTarget: function (t) { target = t; },
    getTarget: function () { return target; },
    getYaw: function () { return yaw; },
    getDesiredYaw: function () { return desiredYaw; },
    getPitch: function () { return pitch; },
    getDesiredPitch: function () { return desiredPitch; },
    getDistance: function () { return distance; },
    getDesiredDistance: function () { return desiredDistance; },
    setYaw: function (v) { desiredYaw = v; },
    setPitch: function (v) { desiredPitch = clampVal(v, MIN_PITCH, MAX_PITCH); },
    setDistance: function (v) { desiredDistance = clampVal(v, MIN_DISTANCE, MAX_DISTANCE); },
    getForwardDir: getForwardDir,
    getRightDir: getRightDir,
    setBounds: function (b) { bounds = b || bounds; },
    setEnabled: function (v) { enabled = v; },
    isEnabled: function () { return enabled; },
    setSmoothing: function (v) { smoothing = v; },
    setCollisionObjects: setCollisionObjects,
    setOccluderObjects: setOccluderObjects,
    applyViewportPreset: applyViewportPreset,
    destroy: destroy,
    MIN_DISTANCE: MIN_DISTANCE,
    MAX_DISTANCE: MAX_DISTANCE,
    MIN_PITCH: MIN_PITCH,
    MAX_PITCH: MAX_PITCH,
    DEFAULT_YAW: DEFAULT_YAW,
    DEFAULT_PITCH: DEFAULT_PITCH,
    DEFAULT_DISTANCE: DEFAULT_DISTANCE,
    LOOK_AT_OFFSET_Y: LOOK_AT_OFFSET_Y
  };
}

export {
  createCameraController,
  CAMERA_PRESETS,
  CAMERA_MODE_FOLLOW,
  CAMERA_MODE_FOCUS,
  CAMERA_MODE_OVERVIEW,
  resolveCameraPreset,
  DEFAULT_YAW,
  DEFAULT_PITCH,
  DEFAULT_DISTANCE,
  MIN_DISTANCE,
  MAX_DISTANCE,
  MIN_PITCH,
  MAX_PITCH,
  LOOK_AT_OFFSET_Y
};
