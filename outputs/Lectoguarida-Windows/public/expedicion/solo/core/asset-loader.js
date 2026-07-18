/**
 * asset-loader.js
 * Cargador común de assets temporales para el perfil No Lectores.
 * Resiliente: un fallo de asset nunca impide iniciar el juego.
 *
 * Características:
 *  - timeout configurable por asset;
 *  - manejo de 404 y de red interrumpida;
 *  - validación de MIME contra una lista permitida;
 *  - caché por sesión (en memoria);
 *  - precarga no bloqueante con Promise.allSettled;
 *  - destrucción segura (ignora resultados pendientes);
 *  - sin promesas sin capturar.
 *
 * No valida ni ejecuta el contenido del asset más allá de su tipo MIME.
 */

var AssetLoader = (function () {
  'use strict';

  var ALLOWED_TYPES = ['image/svg+xml', 'image/png', 'image/webp'];
  var DEFAULT_TIMEOUT = 6000;
  var DEFAULT_BASE = '/expedicion/solo/assets/non-reader/';

  function AssetLoader(options) {
    options = options || {};
    this.sessionCache = {};
    this.destroyed = false;
    this.timeout = (typeof options.timeout === 'number') ? options.timeout : DEFAULT_TIMEOUT;
    this.allowedTypes = options.allowedTypes || ALLOWED_TYPES;
    this.baseUrl = options.baseUrl || DEFAULT_BASE;
    this.fetchImpl = options.fetch || (typeof window !== 'undefined' && window.fetch ? window.fetch.bind(window) : null);
    this._pending = [];
  }

  AssetLoader.prototype._isExternal = function (url) {
    if (typeof url !== 'string') return true;
    if (url.indexOf('data:') === 0) return true;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
      var loc = (typeof window !== 'undefined' && window.location) ? window.location.origin : null;
      if (loc && url.indexOf(loc) === 0) return false;
      return true;
    }
    return false;
  };

  AssetLoader.prototype._fetch = function (url) {
    var self = this;
    if (!this.fetchImpl) {
      return Promise.reject(new Error('no-fetch-available'));
    }
    var controller = null;
    var signal = null;
    if (typeof AbortController !== 'undefined') {
      controller = new AbortController();
      signal = controller.signal;
    }
    var timer = setTimeout(function () {
      if (controller) controller.abort();
    }, this.timeout);

    this._pending.push({ controller: controller, timer: timer });

    return this.fetchImpl(url, signal ? { signal: signal } : undefined).then(function (res) {
      clearTimeout(timer);
      if (!res) throw new Error('empty-response');
      if (res.status === 404) throw new Error('not-found');
      if (!res.ok) throw new Error('http-' + res.status);
      var contentType = (res.headers && typeof res.headers.get === 'function') ? res.headers.get('content-type') : '';
      return res.text().then(function (body) {
        return { contentType: contentType || '', body: body };
      });
    }, function (err) {
      clearTimeout(timer);
      throw err;
    });
  };

  AssetLoader.prototype._validateType = function (def, fetched) {
    var fetchedType = (fetched && fetched.contentType) ? fetched.contentType.split(';')[0].trim() : '';
    var declaredType = (def && def.type) ? def.type : '';
    var type = fetchedType || declaredType;
    if (this.allowedTypes.indexOf(type) === -1) {
      throw new Error('mime-not-allowed:' + type);
    }
    if (fetchedType && declaredType && fetchedType !== declaredType) {
      throw new Error('mime-mismatch:' + fetchedType);
    }
    return type;
  };

  AssetLoader.prototype.validateManifest = function (manifest) {
    if (!manifest || typeof manifest !== 'object') {
      return { valid: false, error: 'manifest-not-object' };
    }
    if (!Array.isArray(manifest.assets)) {
      return { valid: false, error: 'assets-not-array' };
    }
    if (!manifest.gameId || typeof manifest.gameId !== 'string') {
      return { valid: false, error: 'gameId-missing' };
    }
    var seen = {};
    for (var i = 0; i < manifest.assets.length; i++) {
      var a = manifest.assets[i];
      if (!a || typeof a !== 'object') return { valid: false, error: 'asset-not-object' };
      if (!a.id) return { valid: false, error: 'asset-id-missing' };
      if (seen[a.id]) return { valid: false, error: 'duplicate-id:' + a.id };
      seen[a.id] = true;
      if (!a.src || typeof a.src !== 'string') return { valid: false, error: 'src-missing:' + a.id };
      if (this._isExternal(a.src)) return { valid: false, error: 'external-url:' + a.id };
      if (!a.type || typeof a.type !== 'string') return { valid: false, error: 'type-missing:' + a.id };
      if (this.allowedTypes.indexOf(a.type) === -1) return { valid: false, error: 'type-not-allowed:' + a.id };
      if (!a.alt || typeof a.alt !== 'string' || !a.alt.trim()) return { valid: false, error: 'alt-missing:' + a.id };
      if (!a.fallback || (typeof a.fallback !== 'string' && typeof a.fallback !== 'object')) {
        return { valid: false, error: 'fallback-missing:' + a.id };
      }
    }
    return { valid: true, error: null };
  };

  AssetLoader.prototype.loadManifest = function (manifestUrl) {
    var self = this;
    if (this.destroyed) return Promise.reject(new Error('destroyed'));
    return this._fetch(manifestUrl).then(function (fetched) {
      var manifest;
      try {
        manifest = JSON.parse(fetched.body);
      } catch (e) {
        throw new Error('manifest-parse-error');
      }
      var result = self.validateManifest(manifest);
      if (!result.valid) {
        var err = new Error(result.error);
        err.code = result.error;
        throw err;
      }
      return manifest;
    });
  };

  AssetLoader.prototype.loadAsset = function (def) {
    var self = this;
    if (this.destroyed) return Promise.reject(new Error('destroyed'));
    if (!def || !def.id) return Promise.reject(new Error('invalid-def'));
    if (this.sessionCache[def.id]) {
      return Promise.resolve(this.sessionCache[def.id]);
    }
    var url = def.src;
    if (url.indexOf('/') !== 0 && !/^https?:/i.test(url)) {
      url = this.baseUrl + url.replace(/^\.\//, '');
    }
    return this._fetch(url).then(function (fetched) {
      self._validateType(def, fetched);
      if (self.destroyed) return def;
      var stored = {
        id: def.id,
        src: url,
        type: def.type,
        alt: def.alt,
        fallback: def.fallback,
        category: def.category || 'option',
        ok: true
      };
      self.sessionCache[def.id] = stored;
      return stored;
    }, function (err) {
      var fallback = {
        id: def.id,
        src: def.src,
        type: def.type,
        alt: def.alt,
        fallback: def.fallback,
        category: def.category || 'option',
        ok: false,
        error: err && err.message ? err.message : 'load-failed'
      };
      self.sessionCache[def.id] = fallback;
      return fallback;
    });
  };

  AssetLoader.prototype.preloadAssets = function (defs) {
    var self = this;
    if (this.destroyed) return Promise.resolve([]);
    if (!Array.isArray(defs)) return Promise.resolve([]);
    var all = defs.map(function (d) { return self.loadAsset(d); });
    return Promise.allSettled(all).then(function (results) {
      return results.map(function (r) {
        return (r.status === 'fulfilled') ? r.value : (r.reason || { ok: false });
      });
    });
  };

  AssetLoader.prototype.getAsset = function (id) {
    return this.sessionCache[id] || null;
  };

  AssetLoader.prototype.resolveFallback = function (def) {
    if (!def) return null;
    if (def.fallback && typeof def.fallback === 'string') return def.fallback;
    if (def.fallback && def.fallback.emoji) return def.fallback.emoji;
    return null;
  };

  AssetLoader.prototype.clearSessionCache = function () {
    this.sessionCache = {};
  };

  AssetLoader.prototype.destroy = function () {
    this.destroyed = true;
    this._pending.forEach(function (p) {
      if (p.timer) clearTimeout(p.timer);
      if (p.controller && p.controller.abort) {
        try { p.controller.abort(); } catch (e) { /* ignore */ }
      }
    });
    this._pending = [];
    this.sessionCache = {};
  };

  AssetLoader.ALLOWED_TYPES = ALLOWED_TYPES;

  return { create: function (options) { return new AssetLoader(options); }, ALLOWED_TYPES: ALLOWED_TYPES };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AssetLoader };
}
if (typeof window !== 'undefined') {
  window.AssetLoader = AssetLoader;
}
