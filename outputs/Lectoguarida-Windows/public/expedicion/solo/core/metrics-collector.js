/**
 * metrics-collector.js
 * Recolector local y privado de metricas pedagogicas para el modo individual.
 *
 * Restricciones estrictas:
 * - Solo navegador (localStorage) o fallback en memoria durante la sesion.
 * - Sin red: no fetch, no WebSocket, no sendBeacon, no XHR.
 * - Sin PII: no nombre, RUT, correo, audio, voz, imagen, texto libre, userAgent.
 * - Por estudiante: namespace lectoguarida:solo-metrics:v1:<studentProfileId>.
 * - Independiente de ProgressRepository y RewardManager.
 */

var MetricsCollector = (function () {
  'use strict';

  var METRICS_EVENT_VERSION = 1;
  var DEFAULT_MAX_EVENTS = 500;
  var MIN_MAX_EVENTS = 50;
  var MAX_MAX_EVENTS = 1000;

  var VALID_METRIC_EVENT_TYPES = [
    'session_started',
    'instruction_played',
    'instruction_repeated',
    'hint_used',
    'answer_submitted',
    'round_completed',
    'game_completed',
    'game_abandoned',
    'game_error_recovered'
  ];

  var VALID_DIFFICULTIES = ['support', 'standard', 'challenge'];
  var VALID_INPUT_MODES = ['mouse', 'touch', 'keyboard', 'unknown'];
  var VALID_READER_PROFILES = ['non_reader', 'beginner', 'intermediate', 'advanced', 'collaborative'];

  var FORBIDDEN_FIELDS = [
    'name', 'fullName', 'studentName', 'rut', 'email', 'phone', 'address',
    'photo', 'image', 'audio', 'voice', 'video', 'microphone', 'camera',
    'landmarks', 'biometric', 'freeText', 'answerText', 'transcript',
    'ip', 'userAgent', 'deviceId', 'browser', 'school', 'teacher', 'course'
  ];

  var ALLOWED_TOP_LEVEL = [
    'eventVersion', 'eventId', 'studentProfileId', 'sessionId', 'readerProfile',
    'gameId', 'skill', 'difficulty', 'eventType', 'playedAt', 'rounds',
    'correctAnswers', 'incorrectAnswers', 'attempts', 'hintsUsed', 'repeatedAudio',
    'durationMs', 'stars', 'inputMode', 'specific'
  ];

  var GAME_SKILL = {
    'rhyme-catcher': 'phonological_awareness',
    'initial-sound-detector': 'phonological_awareness',
    'syllable-counter': 'phonological_awareness',
    'final-sound-catcher': 'phonological_awareness',
    'vocal-a': 'phonological_awareness'
  };

  var GAME_SUBSKILL = {
    'rhyme-catcher': 'rhyme',
    'initial-sound-detector': 'initial_sound',
    'syllable-counter': 'syllable_segmentation',
    'final-sound-catcher': 'final_sound',
    'vocal-a': 'vowel'
  };

  var GAME_SPECIFIC_ALLOWLIST = {
    'rhyme-catcher': ['targetWordId', 'selectedItemId', 'rhymeCorrect', 'errorType'],
    'initial-sound-detector': ['targetPhoneme', 'selectedItemId', 'phonemeCorrect', 'errorType'],
    'syllable-counter': ['wordId', 'expectedCount', 'selectedCount', 'difference'],
    'final-sound-catcher': ['targetEnding', 'selectedItemId', 'endingCorrect', 'errorType']
  };

  function _isObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  function _hasControlChars(s) {
    for (var i = 0; i < s.length; i++) {
      var code = s.charCodeAt(i);
      if (code < 32) return true;
    }
    return false;
  }

  function _sanitizeStudentId(id) {
    if (id === null || id === undefined) return '';
    var s = String(id).trim();
    if (s.length === 0) return '';
    if (s.length > 128) return '';
    if (_hasControlChars(s)) return '';
    return s;
  }

  function _namespaceFor(studentProfileId) {
    return 'lectoguarida:solo-metrics:v1:' + studentProfileId;
  }

  function _createEventId() {
    var t = Date.now().toString(36);
    var r = Math.random().toString(36).slice(2, 10);
    return 'evt-' + t + '-' + r;
  }

  function _nowIso() {
    try { return new Date().toISOString(); } catch (e) { return '1970-01-01T00:00:00.000Z'; }
  }

  function _safeNumber(v, max) {
    var n = Number(v);
    if (!isFinite(n) || isNaN(n)) return null;
    if (n < 0) n = 0;
    if (typeof max === 'number' && n > max) n = max;
    return Math.round(n);
  }

  function _normalizeGameId(gameId) {
    if (typeof GameIdNormalizer !== 'undefined' && GameIdNormalizer.normalizeGameId) {
      return GameIdNormalizer.normalizeGameId(gameId);
    }
    return gameId;
  }

  function MetricsCollector(options) {
    options = options || {};
    var rawId = options.studentProfileId;
    var studentProfileId = _sanitizeStudentId(rawId);
    if (!studentProfileId) {
      throw new Error('MetricsCollector: studentProfileId invalido o vacio');
    }
    this._studentProfileId = studentProfileId;
    this._namespace = _namespaceFor(studentProfileId);
    this._maxEvents = this._clampMax(options.maxEvents);
    this._devMode = !!options.devMode;
    this._storage = options.storage || _defaultStorage();
    this._memoryFallback = null;
    this._usingFallback = false;
    this._destroyed = false;
  }

  MetricsCollector.METRICS_EVENT_VERSION = METRICS_EVENT_VERSION;
  MetricsCollector.DEFAULT_MAX_EVENTS = DEFAULT_MAX_EVENTS;
  MetricsCollector.VALID_METRIC_EVENT_TYPES = VALID_METRIC_EVENT_TYPES;

  MetricsCollector.prototype._clampMax = function (max) {
    var n = _safeNumber(max, MAX_MAX_EVENTS);
    if (n === null) return DEFAULT_MAX_EVENTS;
    if (n < MIN_MAX_EVENTS) return MIN_MAX_EVENTS;
    if (n > MAX_MAX_EVENTS) return MAX_MAX_EVENTS;
    return n;
  };

  MetricsCollector.prototype._readStore = function () {
    if (this._destroyed) return this._emptyStore();
    if (this._usingFallback) return this._memoryFallback || this._emptyStore();
    try {
      var raw = this._storage.getItem(this._namespace);
      if (!raw) return this._emptyStore();
      return this._parseStore(raw);
    } catch (e) {
      return this._emptyStore();
    }
  };

  MetricsCollector.prototype._parseStore = function (raw) {
    var data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return this._recoverCorruptStore(raw);
    }
    if (!_isObject(data)) return this._recoverCorruptStore(raw);
    if (!Array.isArray(data.events)) data.events = [];
    if (typeof data.version !== 'number') data.version = METRICS_EVENT_VERSION;
    if (typeof data.studentProfileId !== 'string') data.studentProfileId = this._studentProfileId;
    if (typeof data.updatedAt !== 'string') data.updatedAt = _nowIso();
    return data;
  };

  MetricsCollector.prototype._recoverCorruptStore = function (raw) {
    var recovered = this._emptyStore();
    if (typeof raw === 'string' && raw.length > 0) {
      recovered._lastCorrupted = true;
    }
    return recovered;
  };

  MetricsCollector.prototype._emptyStore = function () {
    return {
      version: METRICS_EVENT_VERSION,
      studentProfileId: this._studentProfileId,
      updatedAt: _nowIso(),
      events: []
    };
  };

  MetricsCollector.prototype._writeStore = function (store) {
    if (this._destroyed) return false;
    store.updatedAt = _nowIso();
    store.studentProfileId = this._studentProfileId;
    var json;
    try { json = JSON.stringify(store); } catch (e) { return false; }
    if (this._usingFallback) {
      this._memoryFallback = store;
      return true;
    }
    try {
      this._storage.setItem(this._namespace, json);
      return true;
    } catch (e) {
      this._useMemoryFallback(store);
      return true;
    }
  };

  MetricsCollector.prototype._useMemoryFallback = function (store) {
    this._usingFallback = true;
    this._memoryFallback = store || this._emptyStore();
  };

  MetricsCollector.prototype._stripForbidden = function (obj) {
    if (!_isObject(obj)) return obj;
    var out = {};
    Object.keys(obj).forEach(function (k) {
      if (FORBIDDEN_FIELDS.indexOf(k) !== -1) return;
      out[k] = obj[k];
    });
    return out;
  };

  MetricsCollector.prototype._limitEventSize = function (event) {
    var limited = {};
    Object.keys(event).forEach(function (k) {
      var v = event[k];
      if (_isObject(v)) {
        limited[k] = _limitObjectDepth(v, 1);
      } else if (typeof v === 'string' && v.length > 256) {
        limited[k] = v.slice(0, 256);
      } else {
        limited[k] = v;
      }
    });
    return limited;
  };

  function _limitObjectDepth(obj, depth) {
    if (depth <= 0) return undefined;
    var out = {};
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (_isObject(v)) out[k] = _limitObjectDepth(v, depth - 1);
      else out[k] = v;
    });
    return out;
  }

  MetricsCollector.prototype._normalizeEvent = function (event) {
    var e = this._stripForbidden(event || {});
    e = this._limitEventSize(e);
    e = Object.assign({}, e);

    if (e.specific && _isObject(e.specific)) {
      Object.keys(e.specific).forEach(function (k) { e[k] = e.specific[k]; });
    }

    e.eventVersion = METRICS_EVENT_VERSION;
    e.eventId = (typeof e.eventId === 'string' && e.eventId) ? e.eventId : _createEventId();
    e.studentProfileId = this._studentProfileId;
    e.sessionId = (typeof e.sessionId === 'string' && e.sessionId) ? e.sessionId : 'session-unknown';
    e.readerProfile = (VALID_READER_PROFILES.indexOf(e.readerProfile) !== -1) ? e.readerProfile : 'non_reader';
    e.gameId = _normalizeGameId(e.gameId || 'unknown');
    e.skill = (GAME_SKILL[e.gameId]) ? GAME_SKILL[e.gameId] : (typeof e.skill === 'string' ? e.skill : 'unknown');
    e.difficulty = (VALID_DIFFICULTIES.indexOf(e.difficulty) !== -1) ? e.difficulty : 'standard';

    if (VALID_METRIC_EVENT_TYPES.indexOf(e.eventType) === -1) {
      return null;
    }

    if (typeof e.playedAt !== 'string' || isNaN(Date.parse(e.playedAt))) {
      e.playedAt = _nowIso();
    }

    var numericFields = ['rounds', 'correctAnswers', 'incorrectAnswers', 'attempts', 'hintsUsed', 'repeatedAudio', 'durationMs', 'stars'];
    numericFields.forEach(function (f) {
      if (e[f] === undefined || e[f] === null) return;
      var n = _safeNumber(e[f], 1000000);
      if (n === null) { delete e[f]; return; }
      e[f] = n;
    });

    if (e.inputMode !== undefined && VALID_INPUT_MODES.indexOf(e.inputMode) === -1) {
      e.inputMode = 'unknown';
    }

    if (GAME_SPECIFIC_ALLOWLIST[e.gameId]) {
      var allow = GAME_SPECIFIC_ALLOWLIST[e.gameId];
      var specific = {};
      allow.forEach(function (k) {
        if (e[k] !== undefined) specific[k] = e[k];
      });
      e.specific = specific;
      allow.forEach(function (k) { delete e[k]; });
    } else if (e.specific && _isObject(e.specific)) {
      delete e.specific;
    }

    var cleaned = {};
    ALLOWED_TOP_LEVEL.forEach(function (k) {
      if (e[k] !== undefined) cleaned[k] = e[k];
    });
    e = cleaned;

    delete e._lastCorrupted;
    return e;
  };

  MetricsCollector.prototype._validateEvent = function (event) {
    var e = event || {};
    if (!_isObject(e)) return false;
    if (VALID_METRIC_EVENT_TYPES.indexOf(e.eventType) === -1) return false;
    if (typeof e.gameId !== 'string' || !e.gameId) return false;
    if (typeof e.sessionId !== 'string' || !e.sessionId) return false;
    var numericFields = ['rounds', 'correctAnswers', 'incorrectAnswers', 'attempts', 'hintsUsed', 'repeatedAudio', 'durationMs', 'stars'];
    for (var i = 0; i < numericFields.length; i++) {
      var f = numericFields[i];
      if (e[f] !== undefined && e[f] !== null && (typeof e[f] !== 'number' || !isFinite(e[f]))) {
        return false;
      }
    }
    return true;
  };

  MetricsCollector.prototype.recordEvent = function (event) {
    if (this._destroyed) return null;
    var normalized = this._normalizeEvent(event);
    if (!normalized || !this._validateEvent(normalized)) return null;

    var store = this._readStore();
    store.events.push(normalized);
    if (store.events.length > this._maxEvents) {
      store.events = store.events.slice(store.events.length - this._maxEvents);
    }
    this._writeStore(store);
    return normalized;
  };

  MetricsCollector.prototype.getEvents = function (filters) {
    var store = this._readStore();
    var events = store.events.slice();
    filters = filters || {};
    if (filters.gameId) {
      var gid = _normalizeGameId(filters.gameId);
      events = events.filter(function (e) { return e.gameId === gid; });
    }
    if (filters.difficulty) {
      events = events.filter(function (e) { return e.difficulty === filters.difficulty; });
    }
    if (filters.eventType) {
      events = events.filter(function (e) { return e.eventType === filters.eventType; });
    }
    if (filters.sessionId) {
      events = events.filter(function (e) { return e.sessionId === filters.sessionId; });
    }
    if (filters.readerProfile) {
      events = events.filter(function (e) { return e.readerProfile === filters.readerProfile; });
    }
    if (filters.skill) {
      events = events.filter(function (e) { return e.skill === filters.skill; });
    }
    return events;
  };

  MetricsCollector.prototype.getGameSummary = function (gameId) {
    var gid = _normalizeGameId(gameId);
    var events = this.getEvents({ gameId: gid });
    return _buildGameSummary(events, gid);
  };

  MetricsCollector.prototype.getSkillSummary = function (skill) {
    var events = this.getEvents({ skill: skill });
    var gamesIncluded = {};
    events.forEach(function (e) { gamesIncluded[e.gameId] = true; });
    var summary = _aggregate(events);
    summary.skill = skill || 'unknown';
    summary.gamesIncluded = Object.keys(gamesIncluded);
    return summary;
  };

  MetricsCollector.prototype.getSessionSummary = function (sessionId) {
    if (!sessionId) return null;
    var events = this.getEvents({ sessionId: sessionId });
    if (events.length === 0) return null;
    var summary = _aggregate(events);
    summary.sessionId = sessionId;
    return summary;
  };

  function _aggregate(events) {
    var acc = {
      sessions: 0,
      completedSessions: 0,
      totalAttempts: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      hintsUsed: 0,
      repeatedAudio: 0,
      averageDurationMs: 0,
      bestStars: 0,
      lastPlayedAt: null
    };
    var sessionSet = {};
    var durations = [];
    var lastTs = 0;
    events.forEach(function (e) {
      if (e.sessionId) sessionSet[e.sessionId] = true;
      if (e.eventType === 'game_completed') acc.completedSessions++;
      acc.totalAttempts += (typeof e.attempts === 'number') ? e.attempts : 0;
      acc.correctAnswers += (typeof e.correctAnswers === 'number') ? e.correctAnswers : 0;
      acc.incorrectAnswers += (typeof e.incorrectAnswers === 'number') ? e.incorrectAnswers : 0;
      acc.hintsUsed += (typeof e.hintsUsed === 'number') ? e.hintsUsed : 0;
      acc.repeatedAudio += (typeof e.repeatedAudio === 'number') ? e.repeatedAudio : 0;
      if (typeof e.stars === 'number' && e.stars > acc.bestStars) acc.bestStars = e.stars;
      if (typeof e.durationMs === 'number' && e.durationMs > 0) durations.push(e.durationMs);
      if (typeof e.playedAt === 'string') {
        var ts = Date.parse(e.playedAt);
        if (!isNaN(ts) && ts > lastTs) { lastTs = ts; acc.lastPlayedAt = e.playedAt; }
      }
    });
    acc.sessions = Object.keys(sessionSet).length;
    var denom = acc.correctAnswers + acc.incorrectAnswers;
    acc.accuracy = denom > 0 ? (acc.correctAnswers / denom) : 0;
    if (durations.length > 0) {
      var sum = 0;
      durations.forEach(function (d) { sum += d; });
      acc.averageDurationMs = Math.round(sum / durations.length);
    }
    return acc;
  }

  function _buildGameSummary(events, gid) {
    var summary = _aggregate(events);
    summary.gameId = gid;
    return summary;
  }

  MetricsCollector.prototype.prune = function () {
    var store = this._readStore();
    var events = store.events.slice();

    var seenIds = {};
    var cleaned = [];
    events.forEach(function (e) {
      if (!_isObject(e)) return;
      if (!e.eventId) return;
      if (seenIds[e.eventId]) return;
      if (VALID_METRIC_EVENT_TYPES.indexOf(e.eventType) === -1) return;
      var fixed = Object.assign({}, e);
      fixed.gameId = _normalizeGameId(fixed.gameId || 'unknown');
      if (typeof fixed.playedAt !== 'string' || isNaN(Date.parse(fixed.playedAt))) {
        fixed.playedAt = _nowIso();
      }
      seenIds[fixed.eventId] = true;
      cleaned.push(fixed);
    });

    cleaned.sort(function (a, b) {
      var ta = Date.parse(a.playedAt) || 0;
      var tb = Date.parse(b.playedAt) || 0;
      return ta - tb;
    });

    if (cleaned.length > this._maxEvents) {
      cleaned = cleaned.slice(cleaned.length - this._maxEvents);
    }

    store.events = cleaned;
    this._writeStore(store);
    return cleaned.length;
  };

  MetricsCollector.prototype.clearDevelopmentMetrics = function () {
    if (!this._devMode) {
      return { cleared: false, reason: 'disabled-in-production' };
    }
    var store = this._emptyStore();
    this._writeStore(store);
    return { cleared: true, reason: 'development-only', studentProfileId: this._studentProfileId };
  };

  MetricsCollector.prototype.destroy = function () {
    this._destroyed = true;
    this._memoryFallback = null;
    this._storage = null;
  };

  function _defaultStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    } catch (e) { /* localStorage puede lanzar en algunos contextos */ }
    return _memoryOnlyStorage();
  }

  function _memoryOnlyStorage() {
    var map = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
      setItem: function (k, v) { map[k] = String(v); },
      removeItem: function (k) { delete map[k]; },
      clear: function () { map = {}; }
    };
  }

  return {
    create: function (options) { return new MetricsCollector(options); },
    MetricsCollector: MetricsCollector,
    METRICS_EVENT_VERSION: METRICS_EVENT_VERSION,
    DEFAULT_MAX_EVENTS: DEFAULT_MAX_EVENTS,
    VALID_METRIC_EVENT_TYPES: VALID_METRIC_EVENT_TYPES,
    FORBIDDEN_FIELDS: FORBIDDEN_FIELDS
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MetricsCollector: MetricsCollector, METRICS_EVENT_VERSION: MetricsCollector.METRICS_EVENT_VERSION, DEFAULT_MAX_EVENTS: MetricsCollector.DEFAULT_MAX_EVENTS, VALID_METRIC_EVENT_TYPES: MetricsCollector.VALID_METRIC_EVENT_TYPES };
}
if (typeof window !== 'undefined') {
  window.MetricsCollector = MetricsCollector;
  window.METRICS_EVENT_VERSION = MetricsCollector.METRICS_EVENT_VERSION;
  window.DEFAULT_MAX_EVENTS = MetricsCollector.DEFAULT_MAX_EVENTS;
  window.VALID_METRIC_EVENT_TYPES = MetricsCollector.VALID_METRIC_EVENT_TYPES;
}
