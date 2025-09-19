// js/state.js - Gerenciamento centralizado do estado
import { Utils } from './utils.js';

const STORAGE_KEY = 'kanban-state-v2';

export class StateManager {
  constructor() {
    this.state = this.loadState();
    this.changeListeners = [];
  }

  // Estado padrão
  getDefaultState() {
    return {
      columns: [
        { id: Utils.uid(), title: 'Backlog' },
        { id: Utils.uid(), title: 'Doing' },
        { id: Utils.uid(), title: 'Done' }
      ],
      lanes: [
        { id: Utils.uid(), title: 'Geral' }
      ],
      cards: [],
      tagDict: [
        { name: 'prio-alta', color: '#ff5252' },
        { name: 'bug', color: '#ffb300' }
      ],
      toolDict: ['JavaScript', 'Python'],
      filter: { tags: [], tools: [], laneIds: [], search: '' }
    };
  }

  // Listeners para mudanças de estado
  onStateChange(callback) {
    this.changeListeners.push(callback);
  }

  notifyStateChange() {
    this.saveState();
    this.changeListeners.forEach(callback => callback(this.state));
  }

  // Persistência
  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Erro ao salvar estado:', e);
    }
  }

  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaultState = this.getDefaultState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      return defaultState;
    }
    
    try {
      return this.migrateState(JSON.parse(raw));
    } catch {
      return this.getDefaultState();
    }
  }

  // Migração para compatibilidade
  migrateState(state) {
    state.columns = state.columns || [];
    state.lanes = state.lanes || [{ id: Utils.uid(), title: 'Geral' }];
    state.cards = state.cards || [];
    state.tagDict = state.tagDict || [];
    state.toolDict = state.toolDict || [];
    state.filter = state.filter || { tags: [], tools: [], laneIds: [], search: '' };
    return state;
  }

  // Getters
  getState() {
    return this.state;
  }

  getColumns() {
    return this.state.columns;
  }

  getLanes() {
    return this.state.lanes;
  }

  getCards() {
    return this.state.cards;
  }

  getTagDict() {
    return this.state.tagDict;
  }

  getToolDict() {
    return this.state.toolDict;
  }

  getFilter() {
    return this.state.filter;
  }

  // Métodos para Lanes
  createLane() {
    this.state.lanes.push({
      id: Utils.uid(),
      title: 'Nova lane'
    });
    this.notifyStateChange();
  }

  updateLane(laneId, updates) {
    const lane = this.state.lanes.find(l => l.id === laneId);
    if (lane) {
      Object.assign(lane, updates);
      this.notifyStateChange();
    }
  }

  deleteLane(laneId, confirm = true) {
    if (confirm && !window.confirm('Excluir esta lane? Os cards serão movidos para a primeira lane.')) {
      return false;
    }
    
    if (this.state.lanes.length === 1) {
      alert('Não é possível excluir a última lane.');
      return false;
    }

    const index = this.state.lanes.findIndex(l => l.id === laneId);
    if (index < 0) return false;

    // Mover cards para primeira lane disponível
    const firstLaneId = this.state.lanes.find(l => l.id !== laneId).id;
    this.state.cards.forEach(card => {
      if (card.laneId === laneId) {
        card.laneId = firstLaneId;
      }
    });

    // Remover lane
    this.state.lanes.splice(index, 1);
    
    // Limpar filtros
    this.state.filter.laneIds = this.state.filter.laneIds.filter(id => id !== laneId);
    
    this.notifyStateChange();
    return true;
  }

  // Métodos para Columns
  createColumn() {
    this.state.columns.push({
      id: Utils.uid(),
      title: 'Nova coluna'
    });
    this.notifyStateChange();
  }

  updateColumn(columnId, updates) {
    const column = this.state.columns.find(c => c.id === columnId);
    if (column) {
      Object.assign(column, updates);
      this.notifyStateChange();
    }
  }

  deleteColumn(columnId, confirm = true) {
    if (confirm && !window.confirm('Excluir esta coluna? Todos os cards desta coluna serão removidos.')) {
      return false;
    }

    const index = this.state.columns.findIndex(c => c.id === columnId);
    if (index < 0) return false;

    // Remover cards da coluna
    this.state.cards = this.state.cards.filter(card => card.columnId !== columnId);
    
    // Remover coluna
    this.state.columns.splice(index, 1);
    
    this.notifyStateChange();
    return true;
  }

  // Métodos para Cards
  createCard({ laneId, columnId } = {}) {
    const card = {
      id: Utils.uid(),
      title: 'Novo card',
      assignee: '',
      duration: '',
      cost: '',
      tools: [],
      tags: [],
      color: '#7c9fff',
      desc: '',
      laneId: laneId || (this.state.lanes[0] && this.state.lanes[0].id),
      columnId: columnId || (this.state.columns[0] && this.state.columns[0].id)
    };
    
    this.state.cards.push(card);
    this.notifyStateChange();
    return card;
  }

  updateCard(cardId, updates) {
    const card = this.state.cards.find(c => c.id === cardId);
    if (card) {
      Object.assign(card, updates);
      this.notifyStateChange();
    }
  }

  moveCard(cardId, { laneId, columnId }) {
    const card = this.state.cards.find(c => c.id === cardId);
    if (!card) return;

    if (laneId) card.laneId = laneId;
    if (columnId) card.columnId = columnId;
    
    this.notifyStateChange();
  }

  deleteCard(cardId, confirm = true) {
    if (confirm && !window.confirm('Excluir este card?')) {
      return false;
    }

    this.state.cards = this.state.cards.filter(c => c.id !== cardId);
    this.notifyStateChange();
    return true;
  }

  // Métodos para Tags
  updateTagDict(tags) {
    this.state.tagDict = tags;
    this.notifyStateChange();
  }

  // Métodos para Tools
  updateToolDict(tools) {
    this.state.toolDict = Array.from(new Set(tools));
    this.notifyStateChange();
  }

  // Métodos para Filtros
  updateFilter(filterUpdates) {
    Object.assign(this.state.filter, filterUpdates);
    this.notifyStateChange();
  }

  // Operações em lote
  setState(newState) {
    this.state = this.migrateState(newState);
    this.notifyStateChange();
  }

  clearBoard() {
    this.state = this.getDefaultState();
    this.notifyStateChange();
  }
}