/**
 * Asset Catalog Loader - Lectoguarida Game Engine V2
 * Módulo para carga diferida y gestión del catálogo de assets
 * Compatible con Motor V2 y Motor Legacy
 */

export class AssetCatalogLoader {
  constructor(options = {}) {
    this.catalogUrl = options.catalogUrl || '/expedicion/solo/adventure/data/asset-prompt-pack.json';
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.worldFilter = options.worldFilter || null;
    this.rarityFilter = options.rarityFilter || null;
    this.loaded = false;
    this.catalog = null;
    this.currentPage = 0;
    this.pageSize = options.pageSize || 48;
    this.searchQuery = '';
    this.container = null;
  }

  /**
   * Carga el catálogo completo desde el servidor
   */
  async load() {
    if (this.loaded && this.catalog) {
      return this.catalog;
    }

    if (this.loadingPromises.has('catalog')) {
      return this.loadingPromises.get('catalog');
    }

    const promise = this._fetchCatalog();
    this.loadingPromises.set('catalog', promise);

    try {
      this.catalog = await promise;
      this.loaded = true;
      return this.catalog;
    } finally {
      this.loadingPromises.delete('catalog');
    }
  }

  async _fetchCatalog() {
    const response = await fetch(this.catalogUrl);
    if (!response.ok) {
      throw new Error(`Failed to load asset catalog: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }

  /**
   * Obtiene assets filtrados por mundo
   */
  async getByWorld(worldId) {
    const catalog = await this.load();
    if (!catalog.worlds[worldId]) return [];
    const prompts = this.catalog.prompts.filter(p => p.world === worldId);
    return this._applyFilters(prompts);
  }

  /**
   * Obtiene assets por rareza
   */
  async getByRarity(rarity) {
    const catalog = await this.load();
    const prompts = this.catalog.prompts.filter(p => p.rarity === rarity);
    return this._applyFilters(prompts);
  }

  /**
   * Obtiene un asset específico por ID
   */
  async getById(id) {
    const catalog = await this.load();
    return this.catalog.prompts.find(p => p.id === id);
  }

  /**
   * Busca por nombre o etiquetas
   */
  async search(query) {
    const catalog = await this.load();
    const lowerQuery = query.toLowerCase();
    const prompts = this.catalog.prompts.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.name.toLowerCase().includes(lowerQuery) ||
      p.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      p.category.toLowerCase().includes(lowerQuery)
    );
    return this._applyFilters(prompts);
  }

  /**
   * Obtiene página paginada de resultados
   */
  async getPage(page = 0, pageSize = this.pageSize) {
    const all = await this._getFiltered();
    const start = page * pageSize;
    return all.slice(start, start + pageSize);
  }

  /**
   * Obtiene total de resultados filtrados
   */
  async getTotalCount() {
    const all = await this._getFiltered();
    return all.length;
  }

  /**
   * Aplica filtros actuales
   */
  _applyFilters(prompts) {
    let filtered = prompts;

    if (this.rarityFilter) {
      filtered = filtered.filter(p => p.rarity === this.rarityFilter);
    }

    if (this.worldFilter) {
      filtered = filtered.filter(p => p.world === this.worldFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.tags.some(t => t.toLowerCase().includes(this.searchQuery)) ||
        p.category.toLowerCase().includes(this.searchQuery)
      );
    }

    return filtered;
  }

  async _getFiltered() {
    const catalog = await this.load();
    return this._applyFilters(this.catalog.prompts);
  }

  /**
   * Establece filtro de mundo
   */
  setWorldFilter(worldId) {
    this.worldFilter = worldId || null;
    this.currentPage = 0;
  }

  /**
   * Establece filtro de rareza
   */
  setRarityFilter(rarity) {
    this.rarityFilter = rarity || null;
    this.currentPage = 0;
  }

  /**
   * Establece búsqueda
   */
  setSearchQuery(query) {
    this.searchQuery = query || '';
    this.currentPage = 0;
  }

  /**
   * Obtiene estadísticas del catálogo
   */
  async getStats() {
    const catalog = await this.load();
    return {
      total: this.catalog.prompts.length,
      byWorld: Object.fromEntries(
        Object.entries(this.catalog.worlds).map(([id, w]) => [
          id,
          { name: w.name, total: w.total }
        ])
      ),
      byRarity: {
        common: this.catalog.prompts.filter(p => p.rarity === 'common').length,
        uncommon: this.catalog.prompts.filter(p => p.rarity === 'uncommon').length,
        rare: this.catalog.prompts.filter(p => p.rarity === 'rare').length,
        legendary: this.catalog.prompts.filter(p => p.rarity === 'legendary').length
      }
    };
  }

  /**
   * Obtiene mundos disponibles
   */
  async getWorlds() {
    const catalog = await this.load();
    return Object.entries(this.catalog.worlds).map(([id, w]) => ({
      id,
      name: w.name,
      ...w
    }));
  }

  /**
   * Obtiene rarezas disponibles
   */
  getRarities() {
    return [
      { id: 'common', name: 'Común', color: '#4CAF50' },
      { id: 'uncommon', name: 'Poco común', color: '#2196F3' },
      { id: 'rare', name: 'Raro', color: '#9C27B0' },
      { id: 'legendary', name: 'Legendario', color: '#FF9800' }
    ];
  }

  /**
   * Obtiene badge de rareza
   */
  getRarityBadge(rarity) {
    const rarities = this.getRarities();
    const r = rarities.find(r => r.id === rarity);
    return r ? { name: r.name, color: r.color } : { name: rarity, color: '#666' };
  }

  /**
   * Limpia caché
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
    this.loaded = false;
    this.catalog = null;
  }
}

/**
 * Crea y monta el catálogo de assets en el DOM
 */
export async function mountAssetCatalog(options = {}) {
  const {
    container = '#asset-catalog-root',
    catalogUrl = '/expedicion/solo/adventure/data/asset-prompt-pack.json',
    initialWorld = 'all',
    initialRarity = 'all',
    pageSize = 48,
    onAssetClick,
    onPreview
  } = options;

  const containerEl = typeof container === 'string'
    ? document.querySelector(container)
    : container;

  if (!containerEl) {
    throw new Error(`Container not found: ${container}`);
  }

  // Cargar CSS si no está cargado
  if (!document.querySelector('link[href*="asset-catalog-loader.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/expedicion/solo/adventure/ui/asset-catalog-loader.css';
    document.head.appendChild(link);
  }

  const loader = new AssetCatalogLoader({
    pageSize: 48
  });

  // Cargar catálogo
  try {
    await loader.load();
  } catch (error) {
    console.error('Failed to load asset catalog:', error);
    containerEl.innerHTML = `
      <div class="asset-catalog__error">
        <h3>Error loading asset catalog</h3>
        <p>${error.message}</p>
        <button class="asset-catalog__retry-btn" onclick="location.reload()">Retry</button>
      </div>
    `;
    throw error;
  }

  // Estado de UI
  let currentWorldFilter = initialWorld === 'all' ? null : initialWorld;
  let currentRarityFilter = initialRarity === 'all' ? null : initialRarity;
  let searchQuery = '';
  let currentPageIndex = 0;

  // Pre-fetch worlds and stats (catalog already loaded)
  const worlds = await loader.getWorlds();
  const worldsWithAll = [{ id: 'all', name: 'Todos los mundos' }, ...worlds];
  const stats = await loader.getStats();

  // Render functions
  function render() {
    const catalog = loader.catalog;
    if (!catalog) return;

    // Apply filters using loader's internal method
    const filtered = loader._applyFilters(catalog.prompts);

    const total = filtered.length;
    const totalPages = Math.ceil(filtered.length / pageSize);
    const page = Math.min(currentPageIndex, totalPages - 1) || 0;
    currentPageIndex = page;
    const start = page * 48;
    const pageItems = filtered.slice(start, start + 48);

    const rarityOptions = [
      { id: 'all', name: 'Todas las rarezas' },
      { id: 'common', name: 'Común', color: '#4CAF50' },
      { id: 'uncommon', name: 'Poco común', color: '#2196F3' },
      { id: 'rare', name: 'Raro', color: '#9C27B0' },
      { id: 'legendary', name: 'Legendario', color: '#FF9800' }
    ];

    containerEl.innerHTML = `
      <div class="asset-catalog">
        <div class="asset-catalog__toolbar">
          <div class="asset-catalog__filter-group">
            <label for="world-filter" class="asset-catalog__label">Mundo</label>
            <select id="world-filter" class="asset-catalog__select">
              ${worldsWithAll.map(w => `<option value="${w.id}" ${currentWorldFilter === w.id ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>
          </div>
          <div class="asset-catalog__filter-group">
            <label for="rarity-filter" class="asset-catalog__label">Rareza</label>
            <select id="rarity-filter" class="asset-catalog__select">
              <option value="all" ${!currentRarityFilter ? 'selected' : ''}>Todas las rarezas</option>
              <option value="common" ${currentRarityFilter === 'common' ? 'selected' : ''}>Común</option>
              <option value="uncommon" ${currentRarityFilter === 'uncommon' ? 'selected' : ''}>Poco común</option>
              <option value="rare" ${currentRarityFilter === 'rare' ? 'selected' : ''}>Raro</option>
              <option value="legendary" ${currentRarityFilter === 'legendary' ? 'selected' : ''}>Legendario</option>
            </select>
          </div>
          <div class="asset-catalog__filter-group asset-catalog__filter-group--search">
            <label for="search-input" class="asset-catalog__label">Buscar</label>
            <input type="search" id="search-input" class="asset-catalog__search" placeholder="Buscar por nombre, etiquetas..." value="${searchQuery}">
          </div>
          <div class="asset-catalog__stats">
            <span>${total} assets</span>
            <span class="asset-catalog__page-info">${currentPage + 1} / ${Math.ceil(filtered.length / 48) || 1}</span>
          </div>
        </div>

        <div class="asset-catalog__grid" id="asset-grid">
          ${pageItems.map(asset => renderAssetCard(asset)).join('')}
        </div>

        <div class="asset-catalog__pagination">
          <button class="asset-catalog__page-btn" ${page === 0 ? 'disabled' : ''} data-page="${page - 1}">Anterior</button>
          <span class="asset-catalog__page-info">Página ${page + 1} de ${Math.ceil(filtered.length / 48) || 1}</span>
          <button class="asset-catalog__page-btn" ${page >= Math.ceil(filtered.length / 48) - 1 ? 'disabled' : ''} data-page="${page + 1}">Siguiente</button>
        </div>
      </div>
    `;

    // Bind events
    bindEvents();
  }

  function renderAssetCard(asset) {
    const badge = getRarityBadge(asset.rarity);
    const world = loader.catalog.worlds[asset.world];
    return `
      <article class="asset-card" data-asset-id="${asset.id}">
        <div class="asset-card__badge" style="background: ${badge.color}">${badge.name}</div>
        <div class="asset-card__preview">
          <img class="asset-card__preview-image" src="${asset.previewUrl || '/expedicion/solo/adventure/previews/placeholder.webp'}" alt="${asset.name}" loading="lazy">
          <div class="asset-card__overlay">
            <button class="asset-card__btn asset-card__btn--preview" data-action="preview" data-asset-id="${asset.id}" title="Vista previa">👁</button>
            <button class="asset-card__btn asset-card__btn--secondary" data-action="copy-prompt" data-asset-id="${asset.id}" title="Copiar prompt">📋</button>
          </div>
        </div>
        <div class="asset-card__content">
          <div class="asset-card__header">
            <h3 class="asset-card__name">${asset.name}</h3>
            <span class="asset-card__world">${loader.catalog.worlds[asset.world]?.name || asset.world}</span>
          </div>
          <div class="asset-card__meta">
            <span class="asset-card__category">${asset.category}</span>
            <span class="asset-card__type">${asset.assetType}</span>
          </div>
          <div class="asset-card__tags">
            ${asset.tags.slice(0, 4).map(t => `<span class="asset-card__tag">${t}</span>`).join('')}
            ${asset.tags.length > 4 ? `<span class="asset-card__tag asset-card__tag--more">+${asset.tags.length - 4}</span>` : ''}
          </div>
          <div class="asset-card__stats">
            <span class="asset-card__stat" title="Polígonos">📐 ${asset.polyBudget.toLocaleString()}</span>
            <span class="asset-card__stat" title="Textura">🖼 ${asset.textureSize}px</span>
          </div>
        </div>
      </article>
    `;
  }

  function getRarityBadge(rarity) {
    const map = {
      common: { name: 'Común', color: '#4CAF50' },
      uncommon: { name: 'Poco común', color: '#2196F3' },
      rare: { name: 'Raro', color: '#9C27B0' },
      legendary: { name: 'Legendario', color: '#FF9800' }
    };
    return map[rarity] || { name: rarity, color: '#666' };
  }

  function bindEvents() {
    const grid = containerEl.querySelector('#asset-grid');
    if (!grid) return;

    // Event delegation for asset cards
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const assetId = btn.dataset.assetId;
      const action = btn.dataset.action;
      const asset = loader.catalog.prompts.find(p => p.id === assetId);

      if (!asset) return;

      if (action === 'preview') {
        if (onPreview) {
          onPreview(asset);
        } else {
          showPreviewModal(asset);
        }
      } else if (action === 'copy-prompt') {
        copyPrompt(asset);
      }
    });

    // Filter events
    containerEl.querySelector('#world-filter')?.addEventListener('change', (e) => {
      currentWorldFilter = e.target.value || null;
      currentPageIndex = 0;
      render();
    });

    containerEl.querySelector('#rarity-filter')?.addEventListener('change', (e) => {
      currentRarityFilter = e.target.value === 'all' ? null : e.target.value;
      render();
    });

    containerEl.querySelector('#search-input')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      currentPageIndex = 0;
      render();
    });

    // Pagination
    containerEl.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentPageIndex = parseInt(e.target.dataset.page, 10);
        render();
      });
    });

    // Keyboard support
    containerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePreviewModal();
      }
    });
  }

  function copyPrompt(asset) {
    const prompt = asset.promptEN || asset.promptES || '';
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('Prompt copiado al portapapeles');
    }).catch(() => {
      showToast('Error al copiar', 'error');
    });
  }

  function showPreviewModal(asset) {
    const modal = document.createElement('div');
    modal.className = 'asset-preview-modal';
    modal.innerHTML = `
      <div class="asset-preview-modal__overlay" data-close></div>
      <div class="asset-preview-modal__content">
        <div class="asset-preview-modal__header">
          <h2>${asset.name}</h2>
          <button class="asset-preview-modal__close" data-close>×</button>
        </div>
        <div class="asset-preview-modal__body">
          <img class="asset-preview-modal__image" src="${asset.previewUrl || '/expedicion/solo/adventure/previews/placeholder.webp'}" alt="${asset.name}" loading="lazy">
          <div class="asset-preview-modal__meta">
            <div class="asset-preview-modal__meta-item">
              <div class="asset-preview-modal__meta-label">Mundo</div>
              <div class="asset-preview-modal__meta-value">${loader.catalog.worlds[asset.world]?.name || asset.world}</div>
            </div>
            <div class="asset-preview-modal__meta-item">
              <div class="asset-preview-modal__meta-label">Rareza</div>
              <div class="asset-preview-modal__meta-value">
                <span class="asset-card__badge" style="background: ${getRarityBadge(asset.rarity).color}">${getRarityBadge(asset.rarity).name}</div>
              </div>
            </div>
            <div class="asset-preview-modal__meta-item">
              <div class="asset-preview-modal__meta-label">Categoría</div>
              <div class="asset-preview-modal__meta-value">${asset.category}</div>
            </div>
            <div class="asset-preview-modal__meta-item">
              <div class="asset-preview-modal__meta-label">Tipo</div>
              <div class="asset-preview-modal__meta-value">${asset.assetType}</div>
            </div>
            <div class="asset-preview-modal__meta-item">
              <div class="asset-preview-modal__meta-label">Polígonos</div>
              <div class="asset-preview-modal__meta-value">${asset.polyBudget.toLocaleString()}</div>
            </div>
            <div class="asset-preview-modal__meta-item">
              <div class="asset-preview-modal__meta-label">Textura</div>
              <div class="asset-preview-modal__meta-value">${asset.textureSize}px</div>
            </div>
          </div>
          <div class="asset-preview-modal__palette" title="Paleta de colores">
            ${asset.palette.map(c => `<div class="asset-preview-modal__color" style="background: ${c}" title="${c}"></div>`).join('')}
          </div>
          <div class="asset-preview-modal__prompt">
            <h4>Prompt (ES)</h4>
            <pre>${asset.promptES}</pre>
            <h4>Prompt (EN)</h4>
            <pre>${asset.promptEN}</pre>
            <h4>Negative Prompt</h4>
            <pre>${asset.negativePrompt}</pre>
          </div>
        </div>
        <div class="asset-preview-modal__footer">
          <button class="asset-card__btn asset-card__btn--secondary" data-action="copy-prompt" data-asset-id="${asset.id}">Copiar prompt EN</button>
          <button class="asset-card__btn" data-close>Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // Focus trap
    const closeBtn = modal.querySelector('[data-close]');
    const overlay = modal.querySelector('.asset-preview-modal__overlay');
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    function close() {
      modal.remove();
      document.body.style.overflow = '';
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    }

    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
    modal.addEventListener('click', e => {
      if (e.target.dataset.action === 'copy-prompt') {
        copyPrompt(loader.catalog.prompts.find(p => p.id === e.target.dataset.assetId));
      }
    });

    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      else if (e.key === 'Tab') trapFocus(e);
    });

    firstFocusable?.focus();
  }

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `asset-catalog__toast asset-catalog__toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function copyPrompt(asset) {
    const prompt = asset.promptEN || asset.promptES || '';
    navigator.clipboard.writeText(prompt).then(() => {
      showToast('Prompt copiado al portapapeles');
    }).catch(() => {
      showToast('Error al copiar', 'error');
    });
  }

  function showToast(message, type = 'success') {
    const existing = document.querySelector('.asset-catalog__toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `asset-catalog__toast asset-catalog__toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function closePreviewModal() {
    const modal = document.querySelector('.asset-preview-modal');
    if (modal) {
      document.body.style.overflow = '';
      modal.remove();
    }
  }

  // Initial render
  render();

  return {
    loader,
    render,
    destroy: () => {
      containerEl.innerHTML = '';
    }
  };
}

// Auto-mount if data-auto-mount attribute present
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const autoMount = document.querySelector('[data-auto-mount="asset-catalog"]');
    if (autoMount) {
      const container = autoMount.dataset.container || '#asset-catalog-root';
      const catalogUrl = autoMount.dataset.catalogUrl || '/expedicion/solo/adventure/data/asset-prompt-pack.json';
      const initialWorld = autoMount.dataset.initialWorld || 'all';
      const initialRarity = autoMount.dataset.initialRarity || 'all';
      const pageSize = parseInt(autoMount.dataset.pageSize || '48', 10);

      mountAssetCatalog({
        container,
        catalogUrl,
        initialWorld,
        initialRarity,
        pageSize
      }).catch(console.error);
    }
  });
}

export default AssetCatalogLoader;