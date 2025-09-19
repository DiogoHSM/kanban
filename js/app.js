// js/app.js - Arquivo principal
import { StateManager } from './state.js';
import { UIRenderer } from './ui.js';
import { ModalManager } from './modals.js';
import { ThemeManager } from './theme.js';
import { ImportExportManager } from './import-export.js';
import { DragDropManager } from './drag-drop.js';
import { FilterManager } from './filters.js';
import { Utils } from './utils.js';

class KanbanApp {
  constructor() {
    this.stateManager = new StateManager();
    this.themeManager = new ThemeManager();
    this.modalManager = new ModalManager();
    this.uiRenderer = new UIRenderer(this.stateManager, this.modalManager);
    this.importExportManager = new ImportExportManager(this.stateManager);
    this.dragDropManager = new DragDropManager(this.stateManager);
    this.filterManager = new FilterManager(this.stateManager);

    this.init();
  }

  init() {
    // Executar self-tests
    Utils.runSelfTests();
    
    // Aplicar tema inicial
    this.themeManager.applyTheme(this.themeManager.loadTheme());
    
    // Renderizar interface inicial
    this.render();
    
    // Configurar event listeners
    this.setupEventListeners();
    
    // Configurar drag & drop
    this.dragDropManager.setup(() => this.render());
    
    // Auto-save no state manager
    this.stateManager.onStateChange(() => this.render());
  }

  render() {
    this.uiRenderer.renderBoard();
  }

  setupEventListeners() {
    // Search
    document.getElementById('search').addEventListener('input', (e) => {
      this.filterManager.updateSearch(e.target.value);
      this.render();
    });

    // Header buttons
    document.getElementById('btnNewLane').addEventListener('click', () => {
      this.stateManager.createLane();
    });

    document.getElementById('btnNewColumn').addEventListener('click', () => {
      this.stateManager.createColumn();
    });

    document.getElementById('btnFilters').addEventListener('click', () => {
      this.modalManager.openFiltersModal(this.stateManager, this.filterManager);
    });

    // Menu
    this.setupMenuListeners();
  }

  setupMenuListeners() {
    const menuBtn = document.getElementById('btnMenu');
    const menuPanel = document.getElementById('menuPanel');
    
    menuBtn.addEventListener('click', (e) => {
      menuPanel.classList.toggle('open');
      
      const closeMenu = (ev) => {
        if (!menuPanel.contains(ev.target) && ev.target !== menuBtn) {
          menuPanel.classList.remove('open');
          document.removeEventListener('click', closeMenu);
        }
      };
      
      setTimeout(() => document.addEventListener('click', closeMenu), 0);
    });

    // Theme buttons
    document.getElementById('btnThemeLight').addEventListener('click', () => {
      this.themeManager.applyTheme('light');
    });

    document.getElementById('btnThemeDark').addEventListener('click', () => {
      this.themeManager.applyTheme('dark');
    });

    // Menu items
    menuPanel.addEventListener('click', (e) => {
      const item = e.target.closest('[data-menu]');
      if (!item) return;

      const action = item.dataset.menu;
      menuPanel.classList.remove('open');

      switch (action) {
        case 'tags':
          this.modalManager.openTagsManager(this.stateManager);
          break;
        case 'tools':
          this.modalManager.openToolsManager(this.stateManager);
          break;
        case 'export':
          this.importExportManager.exportJSON();
          break;
        case 'import':
          this.importExportManager.importJSONPrompt();
          break;
        case 'clear':
          this.clearBoard();
          break;
      }
    });
  }

  clearBoard() {
    if (!confirm('Tem certeza? Isso limpará todo o quadro.')) return;
    this.stateManager.clearBoard();
  }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new KanbanApp();
});