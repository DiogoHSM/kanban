// js/filters.js - Sistema de filtros
import { Utils } from './utils.js';

export class FilterManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.setupSearchDebounce();
  }

  setupSearchDebounce() {
    // Debounce da busca para melhor performance
    this.debouncedSearch = Utils.debounce((searchTerm) => {
      this.updateSearch(searchTerm);
    }, 300);
  }

  updateSearch(searchTerm) {
    this.stateManager.updateFilter({ search: searchTerm });
  }

  updateTagFilters(tags) {
    this.stateManager.updateFilter({ tags });
  }

  updateToolFilters(tools) {
    this.stateManager.updateFilter({ tools });
  }

  updateLaneFilters(laneIds) {
    this.stateManager.updateFilter({ laneIds });
  }

  clearFilters() {
    const currentFilter = this.stateManager.getFilter();
    this.stateManager.updateFilter({
      tags: [],
      tools: [],
      laneIds: [],
      search: currentFilter.search // Manter apenas a busca
    });
  }

  clearSearch() {
    this.stateManager.updateFilter({ search: '' });
  }

  clearAllFilters() {
    this.stateManager.updateFilter({
      tags: [],
      tools: [],
      laneIds: [],
      search: ''
    });
  }

  // Verificar se filtros estão ativos
  hasActiveFilters() {
    const filter = this.stateManager.getFilter();
    return filter.tags.length > 0 || 
           filter.tools.length > 0 || 
           filter.laneIds.length > 0 || 
           filter.search.length > 0;
  }

  getActiveFilterCount() {
    const filter = this.stateManager.getFilter();
    let count = 0;
    
    if (filter.tags.length > 0) count++;
    if (filter.tools.length > 0) count++;
    if (filter.laneIds.length > 0) count++;
    if (filter.search.length > 0) count++;
    
    return count;
  }

  // Estatísticas de filtros
  getFilterStats() {
    const state = this.stateManager.getState();
    const filter = state.filter;
    
    const totalCards = state.cards.length;
    const filteredCards = state.cards.filter(card => 
      FilterManager.passFilters(card, filter, state)
    );
    
    return {
      total: totalCards,
      visible: filteredCards.length,
      hidden: totalCards - filteredCards.length,
      filterCount: this.getActiveFilterCount()
    };
  }

  // Método estático para verificar se um card passa pelos filtros
  static passFilters(card, filter, state) {
    // Filtro de busca por texto
    if (filter.search && filter.search.length > 0) {
      const searchTerm = filter.search.toLowerCase();
      const searchableText = [
        card.title || '',
        card.assignee || '',
        card.desc || ''
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }

    // Filtro por lanes
    if (filter.laneIds && filter.laneIds.length > 0) {
      if (!filter.laneIds.includes(card.laneId)) {
        return false;
      }
    }

    // Filtro por tags (deve ter TODAS as tags selecionadas)
    if (filter.tags && filter.tags.length > 0) {
      const cardTags = card.tags || [];
      if (!filter.tags.every(tag => cardTags.includes(tag))) {
        return false;
      }
    }

    // Filtro por ferramentas (deve ter TODAS as ferramentas selecionadas)
    if (filter.tools && filter.tools.length > 0) {
      const cardTools = card.tools || [];
      if (!filter.tools.every(tool => cardTools.includes(tool))) {
        return false;
      }
    }

    return true;
  }

  // Filtros avançados
  filterByDateRange(startDate, endDate) {
    // Implementação futura para filtrar por datas
    // Necessário adicionar campos de data aos cards
  }

  filterByAssignee(assignee) {
    this.updateSearch(assignee);
  }

  filterByPriority(priority) {
    // Implementação futura para filtrar por prioridade
    // Necessário adicionar campo de prioridade aos cards
  }

  // Filtros salvos
  saveFilter(name, filterConfig) {
    try {
      const savedFilters = this.getSavedFilters();
      savedFilters[name] = {
        ...filterConfig,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('kanban-saved-filters', JSON.stringify(savedFilters));
      return true;
    } catch (error) {
      console.error('Error saving filter:', error);
      return false;
    }
  }

  getSavedFilters() {
    try {
      const saved = localStorage.getItem('kanban-saved-filters');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  loadFilter(name) {
    const savedFilters = this.getSavedFilters();
    const filter = savedFilters[name];
    
    if (filter) {
      this.stateManager.updateFilter({
        tags: filter.tags || [],
        tools: filter.tools || [],
        laneIds: filter.laneIds || [],
        search: filter.search || ''
      });
      return true;
    }
    
    return false;
  }

  deleteFilter(name) {
    try {
      const savedFilters = this.getSavedFilters();
      delete savedFilters[name];
      localStorage.setItem('kanban-saved-filters', JSON.stringify(savedFilters));
      return true;
    } catch (error) {
      console.error('Error deleting filter:', error);
      return false;
    }
  }

  // Filtros inteligentes
  getSmartFilters(state) {
    const cards = state.cards;
    
    return {
      unassigned: {
        name: 'Sem responsável',
        filter: { search: '', tags: [], tools: [], laneIds: [] },
        test: (card) => !card.assignee || card.assignee.trim() === ''
      },
      
      noEstimate: {
        name: 'Sem estimativa',
        filter: { search: '', tags: [], tools: [], laneIds: [] },
        test: (card) => !card.duration || card.duration.trim() === ''
      },
      
      highPriority: {
        name: 'Alta prioridade',
        filter: { tags: ['prio-alta'], tools: [], laneIds: [], search: '' },
        test: (card) => (card.tags || []).includes('prio-alta')
      },
      
      bugs: {
        name: 'Bugs',
        filter: { tags: ['bug'], tools: [], laneIds: [], search: '' },
        test: (card) => (card.tags || []).includes('bug')
      }
    };
  }

  applySmartFilter(filterName, state) {
    const smartFilters = this.getSmartFilters(state);
    const smartFilter = smartFilters[filterName];
    
    if (smartFilter) {
      this.stateManager.updateFilter(smartFilter.filter);
      return true;
    }
    
    return false;
  }

  