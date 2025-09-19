// js/ui.js - Renderização da interface
import { Utils } from './utils.js';
import { FilterManager } from './filters.js';

export class UIRenderer {
  constructor(stateManager, modalManager) {
    this.stateManager = stateManager;
    this.modalManager = modalManager;
    this.boardElement = document.getElementById('board');
  }

  renderBoard() {
    this.boardElement.innerHTML = '';
    
    const state = this.stateManager.getState();
    state.lanes.forEach(lane => {
      this.boardElement.appendChild(this.renderLane(lane));
    });
  }

  renderLane(lane) {
    const wrap = Utils.createElement('section', 'lane');
    wrap.dataset.laneId = lane.id;

    const head = this.createLaneHeader(lane);
    const columns = this.createLaneColumns(lane);

    wrap.append(head, columns);
    return wrap;
  }

  createLaneHeader(lane) {
    const head = Utils.createElement('div', 'lane-head');
    
    const title = this.createEditableTitle(lane, 'lane-title', 'Título da swimlane', (newTitle) => {
      this.stateManager.updateLane(lane.id, { title: newTitle });
    });

    const sum = Utils.createElement('div', 'lane-sum');
    sum.textContent = '⏱ ' + Utils.formatMin(this.calculateLaneTotalMinutes(lane));

    const actions = this.createLaneActions(lane);

    head.append(title, sum, actions);
    return head;
  }

  createLaneActions(lane) {
    const actions = Utils.createElement('div', 'lane-actions');
    
    const btnAddCard = Utils.createButton('+ Card', () => {
      const card = this.stateManager.createCard({ laneId: lane.id });
      this.modalManager.openCardModal(card, this.stateManager);
    }, 'small success');

    const btnDeleteLane = Utils.createButton('X', () => {
      this.stateManager.deleteLane(lane.id, true);
    }, 'small danger');

    actions.append(btnAddCard, btnDeleteLane);
    return actions;
  }

  createLaneColumns(lane) {
    const columns = Utils.createElement('div', 'columns');
    
    const state = this.stateManager.getState();
    state.columns.forEach(column => {
      columns.appendChild(this.renderColumn(column, lane));
    });

    return columns;
  }

  renderColumn(column, lane) {
    const colEl = Utils.createElement('article', 'column');
    colEl.dataset.columnId = column.id;

    const head = this.createColumnHeader(column, lane);
    const body = this.createColumnBody(column, lane);

    colEl.append(head, body);
    return colEl;
  }

  createColumnHeader(column, lane) {
    const head = Utils.createElement('div', 'col-head');

    const title = this.createEditableTitle(column, 'col-title', 'Título da coluna', (newTitle) => {
      this.stateManager.updateColumn(column.id, { title: newTitle });
    });

    const sum = Utils.createElement('div', 'col-sum');
    sum.textContent = '⏱ ' + Utils.formatMin(this.calculateColumnTotalMinutes(column, lane));

    const actions = this.createColumnActions(column, lane);

    head.append(title, sum, actions);
    return head;
  }

  createColumnActions(column, lane) {
    const actions = Utils.createElement('div', 'col-actions');

    const btnAddCard = Utils.createButton('+ Card', () => {
      const card = this.stateManager.createCard({ 
        laneId: lane.id, 
        columnId: column.id 
      });
      this.modalManager.openCardModal(card, this.stateManager);
    }, 'small success');

    const btnDeleteColumn = Utils.createButton('X', () => {
      this.stateManager.deleteColumn(column.id, true);
    }, 'small danger');

    actions.append(btnAddCard, btnDeleteColumn);
    return actions;
  }

  createColumnBody(column, lane) {
    const body = Utils.createElement('div', 'col-body');
    body.dataset.dropTarget = 'true';
    body.dataset.laneId = lane.id;
    body.dataset.columnId = column.id;

    // Setup drag & drop events
    this.setupDropEvents(body, lane.id, column.id);

    const cards = this.getFilteredCards(column.id, lane.id);

    if (cards.length === 0) {
      const empty = Utils.createElement('div', 'col-body empty');
      empty.textContent = 'Arraste cards ou clique em + Card';
      body.appendChild(empty);
    } else {
      cards.forEach(card => {
        body.appendChild(this.renderCard(card));
      });
    }

    return body;
  }

  setupDropEvents(body, laneId, columnId) {
    body.addEventListener('dragover', (e) => {
      e.preventDefault();
      body.classList.add('drop-target');
    });

    body.addEventListener('dragleave', () => {
      body.classList.remove('drop-target');
    });

    body.addEventListener('drop', (e) => {
      e.preventDefault();
      body.classList.remove('drop-target');
      
      const cardId = e.dataTransfer.getData('text/card-id');
      if (cardId) {
        this.stateManager.moveCard(cardId, { laneId, columnId });
      }
    });
  }

  renderCard(card) {
    const cardEl = Utils.createElement('div', 'card');
    cardEl.draggable = true;
    cardEl.dataset.cardId = card.id; // Importante para drag & drop
    
    // Drag events
    cardEl.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/card-id', card.id);
    });

    // Click to edit
    cardEl.addEventListener('click', () => {
      this.modalManager.openCardModal(card, this.stateManager);
    });

    const top = Utils.createElement('div', 'card-top');
    top.style.background = card.color || '#7c9fff';

    const body = this.createCardBody(card);

    cardEl.append(top, body);
    return cardEl;
  }

  createCardBody(card) {
    const body = Utils.createElement('div', 'card-body');

    const title = Utils.createElement('div', 'card-title');
    title.textContent = card.title || 'Sem título';

    const chips = this.createCardChips(card);
    const dots = this.createCardTagDots(card);

    body.append(title, chips, dots);
    return body;
  }

  createCardChips(card) {
    const chips = Utils.createElement('div', 'chips');
    
    if (card.assignee) {
      chips.appendChild(Utils.createChip('👤 ' + card.assignee));
    }
    
    if (card.duration) {
      chips.appendChild(Utils.createChip('⏱ ' + card.duration));
    }

    return chips;
  }

  createCardTagDots(card) {
    const dots = Utils.createElement('div', 'tag-dots');
    const tagDict = this.stateManager.getTagDict();
    
    (card.tags || []).forEach(tagName => {
      const tag = tagDict.find(t => t.name === tagName);
      const color = tag ? tag.color : '#888';
      
      const dot = Utils.createElement('span', 'dot');
      dot.title = tagName;
      dot.style.background = color;
      
      dots.appendChild(dot);
    });

    return dots;
  }

  createEditableTitle(item, className, ariaLabel, onUpdate) {
    const title = Utils.createElement('div', className);
    title.contentEditable = 'true';
    title.textContent = item.title;
    title.setAttribute('role', 'textbox');
    title.setAttribute('aria-label', ariaLabel);

    title.addEventListener('blur', () => {
      const newTitle = title.textContent.trim() || 'Sem título';
      if (newTitle !== item.title) {
        onUpdate(newTitle);
      }
    });

    title.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        title.blur();
      }
    });

    return title;
  }

  // Cálculos de tempo
  calculateLaneTotalMinutes(lane) {
    const cards = this.getFilteredCards(null, lane.id);
    return cards.reduce((acc, card) => {
      return acc + Utils.parseDurationToMin(card.duration);
    }, 0);
  }

  calculateColumnTotalMinutes(column, lane) {
    const cards = this.getFilteredCards(column.id, lane.id);
    return cards.reduce((acc, card) => {
      return acc + Utils.parseDurationToMin(card.duration);
    }, 0);
  }

  getFilteredCards(columnId = null, laneId = null) {
    const state = this.stateManager.getState();
    let cards = state.cards;

    // Filtrar por lane e column se especificados
    if (laneId) {
      cards = cards.filter(card => card.laneId === laneId);
    }
    if (columnId) {
      cards = cards.filter(card => card.columnId === columnId);
    }

    // Aplicar filtros do sistema
    return cards.filter(card => FilterManager.passFilters(card, state.filter, state));
  }
}