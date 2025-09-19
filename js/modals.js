// js/modals.js - Sistema de modais
import { Utils } from './utils.js';

export class ModalManager {
  constructor() {
    this.overlay = document.getElementById('overlay');
    this.setupOverlayEvents();
  }

  setupOverlayEvents() {
    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('open')) {
        this.closeModal();
      }
    });

    // Fechar modal clicando fora
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.closeModal();
      }
    });
  }

  openModal(contentElement) {
    this.overlay.innerHTML = '';
    this.overlay.appendChild(contentElement);
    this.overlay.classList.add('open');
    
    // Focus no primeiro elemento focusável
    const focusable = contentElement.querySelector('input, button, textarea, select');
    if (focusable) focusable.focus();
  }

  closeModal() {
    this.overlay.classList.remove('open');
    this.overlay.innerHTML = '';
  }

  openCardModal(card, stateManager) {
    const modal = this.createCardModal(card, stateManager);
    this.openModal(modal);
  }

  createCardModal(card, stateManager) {
    const modal = Utils.createElement('div', 'modal');
    const state = stateManager.getState();
    
    modal.innerHTML = `
      <header><div class="modal-title">Card</div></header>
      <div class="modal-body">
        <form id="cardForm">
          <div class="modal-grid">
            <div class="row">
              <label for="c_title">Nome</label>
              <input id="c_title" required value="${Utils.escapeHtml(card.title)}" />
            </div>
            <div class="row">
              <label for="c_assignee">Responsável</label>
              <select id="c_assignee">
                <option value="">Selecione um responsável</option>
                ${state.assigneeDict.map(assignee => 
                  `<option value="${Utils.escapeHtml(assignee.name)}" ${assignee.name === card.assignee ? 'selected' : ''}>
                    ${Utils.escapeHtml(assignee.name)} (R$ ${assignee.hourlyRate.toFixed(2)}/h)
                  </option>`
                ).join('')}
              </select>
            </div>
            <div class="row">
              <label for="c_duration">Duração</label>
              <input id="c_duration" value="${Utils.escapeHtml(card.duration)}" 
                     placeholder="Ex.: 2h 30m, 1.5h, 90m, 1:30" />
            </div>
            <div class="row">
              <label for="c_cost">Custo Calculado</label>
              <input id="c_cost" value="${Utils.escapeHtml(card.cost)}" readonly 
                     style="background:var(--chip-bg);cursor:not-allowed" />
            </div>
            <div class="row">
              <label>Ferramentas/Tecnologias</label>
              <div id="toolsPicker" class="tokens" role="listbox" aria-multiselectable="true"></div>
            </div>
            <div class="row">
              <label>Tags</label>
              <div id="tagsPicker" class="tokens" role="listbox" aria-multiselectable="true"></div>
            </div>
            <div class="row">
              <label for="c_color">Cor do card</label>
              <input id="c_color" type="color" value="${card.color || '#7c9fff'}" />
            </div>
            <div class="row">
              <label for="c_lane">Swimlane</label>
              <select id="c_lane">
                ${state.lanes.map(l => 
                  `<option value="${l.id}" ${l.id === card.laneId ? 'selected' : ''}>
                    ${Utils.escapeHtml(l.title)}
                  </option>`
                ).join('')}
              </select>
            </div>
            <div class="row">
              <label for="c_col">Coluna</label>
              <select id="c_col">
                ${state.columns.map(c => 
                  `<option value="${c.id}" ${c.id === card.columnId ? 'selected' : ''}>
                    ${Utils.escapeHtml(c.title)}
                  </option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="row" style="margin-top:10px">
            <label for="c_desc">Descrição</label>
            <textarea id="c_desc">${Utils.escapeHtml(card.desc || '')}</textarea>
          </div>
        </form>
      </div>
      <footer>
        <button class="btn danger" id="btnDel">X Excluir</button>
        <div style="flex:1"></div>
        <button class="btn" id="btnClose">Fechar</button>
        <button class="btn success" id="btnSave">Salvar</button>
      </footer>
    `;

    this.setupCardModalPickers(modal, card, state);
    this.setupCardModalEvents(modal, card, stateManager);
    this.setupCostCalculation(modal, stateManager);
    
    return modal;
  }

  setupCardModalPickers(modal, card, state) {
    const tagsEl = modal.querySelector('#tagsPicker');
    const toolsEl = modal.querySelector('#toolsPicker');

    this.renderMultiSelectPicker(tagsEl, state.tagDict, card.tags || []);
    this.renderMultiSelectPicker(toolsEl, state.toolDict, card.tools || []);
  }

  renderMultiSelectPicker(container, options, selected) {
    container.innerHTML = '';
    
    options.forEach(option => {
      const value = typeof option === 'string' ? option : option.name;
      const btn = Utils.createElement('button', 'token');
      btn.type = 'button';
      btn.setAttribute('role', 'option');
      btn.dataset.value = value;
      btn.textContent = value;
      
      if (selected.includes(value)) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      }
      
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        btn.setAttribute('aria-selected', btn.classList.contains('active'));
      });
      
      container.appendChild(btn);
    });
  }

  setupCostCalculation(modal, stateManager) {
    const assigneeSelect = modal.querySelector('#c_assignee');
    const durationInput = modal.querySelector('#c_duration');
    const costInput = modal.querySelector('#c_cost');

    const calculateCost = () => {
      const assigneeName = assigneeSelect.value;
      const duration = durationInput.value;
      
      if (assigneeName && duration) {
        const cost = stateManager.calculateCardCost(assigneeName, duration);
        costInput.value = `R$ ${cost.toFixed(2)}`;
      } else {
        costInput.value = '';
      }
    };

    assigneeSelect.addEventListener('change', calculateCost);
    durationInput.addEventListener('input', calculateCost);
    
    // Calcular custo inicial se já houver dados
    calculateCost();
  }

  setupCardModalEvents(modal, card, stateManager) {
    const form = modal.querySelector('#cardForm');
    
    modal.querySelector('#btnClose').addEventListener('click', () => {
      this.closeModal();
    });

    modal.querySelector('#btnDel').addEventListener('click', () => {
      if (stateManager.deleteCard(card.id, true)) {
        this.closeModal();
      }
    });

    modal.querySelector('#btnSave').addEventListener('click', () => {
      const formData = this.getCardFormData(form, modal);
      stateManager.updateCard(card.id, formData);
      this.closeModal();
    });
  }

  getCardFormData(form, modal) {
    const assigneeName = form.querySelector('#c_assignee').value;
    const duration = form.querySelector('#c_duration').value.trim();
    
    return {
      title: form.querySelector('#c_title').value.trim() || 'Sem título',
      assignee: assigneeName,
      duration: duration,
      cost: form.querySelector('#c_cost').value, // Usar valor calculado
      color: form.querySelector('#c_color').value,
      laneId: form.querySelector('#c_lane').value,
      columnId: form.querySelector('#c_col').value,
      desc: form.querySelector('#c_desc').value.trim(),
      tags: Utils.qsa('#tagsPicker .token.active', modal).map(el => el.dataset.value),
      tools: Utils.qsa('#toolsPicker .token.active', modal).map(el => el.dataset.value)
    };
  }

  openFiltersModal(stateManager, filterManager) {
    const modal = this.createFiltersModal(stateManager, filterManager);
    this.openModal(modal);
  }

  createFiltersModal(stateManager, filterManager) {
    const modal = Utils.createElement('div', 'modal');
    const state = stateManager.getState();
    const filter = state.filter;
    
    modal.innerHTML = `
      <header><div class="modal-title">Filtros</div></header>
      <div class="modal-body">
        <div class="row">
          <label>Tags</label>
          <div class="tokens" id="ft_tags"></div>
        </div>
        <div class="row">
          <label>Tecnologias</label>
          <div class="tokens" id="ft_tools"></div>
        </div>
        <div class="row">
          <label>Swimlanes</label>
          <div class="tokens" id="ft_lanes"></div>
        </div>
      </div>
      <footer>
        <button class="btn" id="clear">Limpar</button>
        <div style="flex:1"></div>
        <button class="btn" id="close">Fechar</button>
        <button class="btn success" id="apply">Aplicar</button>
      </footer>
    `;

    this.setupFiltersModalPickers(modal, state, filter);
    this.setupFiltersModalEvents(modal, stateManager, filterManager);
    
    return modal;
  }

  setupFiltersModalPickers(modal, state, filter) {
    const tagsContainer = modal.querySelector('#ft_tags');
    const toolsContainer = modal.querySelector('#ft_tools');
    const lanesContainer = modal.querySelector('#ft_lanes');

    this.renderTokenFilter(tagsContainer, 
      state.tagDict.map(t => ({ label: t.name, value: t.name })), 
      filter.tags);

    this.renderTokenFilter(toolsContainer, 
      state.toolDict.map(t => ({ label: t, value: t })), 
      filter.tools);

    this.renderTokenFilter(lanesContainer, 
      state.lanes.map(l => ({ label: l.title, value: l.id })), 
      filter.laneIds);
  }

  renderTokenFilter(container, values, selected) {
    container.innerHTML = '';
    
    values.forEach(item => {
      const token = Utils.createElement('button', 'token');
      token.type = 'button';
      token.textContent = item.label;
      token.dataset.value = item.value;
      
      if (selected.includes(item.value)) {
        token.classList.add('active');
      }
      
      token.addEventListener('click', () => {
        token.classList.toggle('active');
      });
      
      container.appendChild(token);
    });
  }

  setupFiltersModalEvents(modal, stateManager, filterManager) {
    modal.querySelector('#close').addEventListener('click', () => {
      this.closeModal();
    });

    modal.querySelector('#clear').addEventListener('click', () => {
      filterManager.clearFilters();
      this.closeModal();
    });

    modal.querySelector('#apply').addEventListener('click', () => {
      const getSelected = (selector) => 
        Utils.qsa(`${selector} .token.active`, modal).map(x => x.dataset.value);

      const filterUpdates = {
        tags: getSelected('#ft_tags'),
        tools: getSelected('#ft_tools'),
        laneIds: getSelected('#ft_lanes')
      };

      stateManager.updateFilter(filterUpdates);
      this.closeModal();
    });
  }

  openTagsManager(stateManager) {
    const modal = this.createTagsManagerModal(stateManager);
    this.openModal(modal);
  }

  createTagsManagerModal(stateManager) {
    const modal = Utils.createElement('div', 'modal');
    const tagDict = stateManager.getTagDict();
    
    modal.innerHTML = `
      <header><div class="modal-title">Gerenciar Tags</div></header>
      <div class="modal-body">
        <div id="tagRows"></div>
        <button class="btn success" id="add">+ Adicionar Tag</button>
      </div>
      <footer>
        <button class="btn" id="close">Fechar</button>
        <button class="btn success" id="save">Salvar</button>
      </footer>
    `;

    const rowsContainer = modal.querySelector('#tagRows');
    
    // Adicionar tags existentes
    tagDict.forEach(tag => this.addTagRow(rowsContainer, tag));
    
    // Event listeners
    modal.querySelector('#add').addEventListener('click', () => {
      this.addTagRow(rowsContainer);
    });

    modal.querySelector('#close').addEventListener('click', () => {
      this.closeModal();
    });

    modal.querySelector('#save').addEventListener('click', () => {
      const tags = this.collectTagsFromRows(rowsContainer);
      stateManager.updateTagDict(tags);
      this.closeModal();
    });

    return modal;
  }

  addTagRow(container, tag = null) {
    const row = Utils.createElement('div', 'row');
    row.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center">
        <input class="t-name" placeholder="Nome" value="${tag ? Utils.escapeHtml(tag.name) : ''}" />
        <input class="t-color" type="color" value="${tag ? tag.color : '#888888'}" />
        <button class="btn small danger t-del">X</button>
      </div>
    `;
    
    row.querySelector('.t-del').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  collectTagsFromRows(container) {
    const tags = [];
    Utils.qsa('.row', container).forEach(row => {
      const name = row.querySelector('.t-name').value.trim();
      const color = row.querySelector('.t-color').value || '#888888';
      if (name) {
        tags.push({ name, color });
      }
    });
    return tags;
  }

  openAssigneesManager(stateManager) {
    const modal = this.createAssigneesManagerModal(stateManager);
    this.openModal(modal);
  }

  createAssigneesManagerModal(stateManager) {
    const modal = Utils.createElement('div', 'modal');
    const assigneeDict = stateManager.getAssigneeDict();
    
    modal.innerHTML = `
      <header><div class="modal-title">Gerenciar Responsáveis</div></header>
      <div class="modal-body">
        <div id="assigneeRows"></div>
        <button class="btn success" id="add">+ Adicionar Responsável</button>
      </div>
      <footer>
        <button class="btn" id="close">Fechar</button>
        <button class="btn success" id="save">Salvar</button>
      </footer>
    `;

    const rowsContainer = modal.querySelector('#assigneeRows');
    
    // Adicionar responsáveis existentes
    assigneeDict.forEach(assignee => this.addAssigneeRow(rowsContainer, assignee));
    
    // Event listeners
    modal.querySelector('#add').addEventListener('click', () => {
      this.addAssigneeRow(rowsContainer);
    });

    modal.querySelector('#close').addEventListener('click', () => {
      this.closeModal();
    });

    modal.querySelector('#save').addEventListener('click', () => {
      const assignees = this.collectAssigneesFromRows(rowsContainer);
      stateManager.updateAssigneeDict(assignees);
      this.closeModal();
    });

    return modal;
  }

  addAssigneeRow(container, assignee = null) {
    const row = Utils.createElement('div', 'row');
    row.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center">
        <input class="a-name" placeholder="Nome completo" value="${assignee ? Utils.escapeHtml(assignee.name) : ''}" />
        <input class="a-rate" type="number" step="0.01" min="0" placeholder="R$/hora" value="${assignee ? assignee.hourlyRate : ''}" />
        <button class="btn small danger a-del">X</button>
      </div>
    `;
    
    row.querySelector('.a-del').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  collectAssigneesFromRows(container) {
    const assignees = [];
    Utils.qsa('.row', container).forEach(row => {
      const name = row.querySelector('.a-name').value.trim();
      const hourlyRate = parseFloat(row.querySelector('.a-rate').value) || 0;
      if (name && hourlyRate > 0) {
        assignees.push({ name, hourlyRate });
      }
    });
    return assignees;
  }

  openReportsModal(stateManager) {
    const modal = this.createReportsModal(stateManager);
    this.openModal(modal);
  }

  createReportsModal(stateManager) {
    const modal = Utils.createElement('div', 'modal reports');
    
    modal.innerHTML = `
      <header><div class="modal-title">Relatórios do Kanban</div></header>
      <div class="modal-body">
        <div class="report-tabs">
          <button class="report-tab active" data-tab="columns">Por Coluna</button>
          <button class="report-tab" data-tab="lanes">Por Lane</button>
          <button class="report-tab" data-tab="assignees">Por Responsável</button>
          <button class="report-tab" data-tab="charts">Gráficos</button>
        </div>
        <div id="reportColumns" class="report-content active"></div>
        <div id="reportLanes" class="report-content"></div>
        <div id="reportAssignees" class="report-content"></div>
        <div id="reportCharts" class="report-content"></div>
      </div>
      <footer>
        <button class="btn" id="closeReports">Fechar</button>
      </footer>
    `;

    this.setupReportTabs(modal);
    this.generateReports(modal, stateManager);

    modal.querySelector('#closeReports').addEventListener('click', () => {
      this.closeModal();
    });

    return modal;
  }

  setupReportTabs(modal) {
    const tabs = modal.querySelectorAll('.report-tab');
    const contents = modal.querySelectorAll('.report-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const targetId = 'report' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
        modal.querySelector('#' + targetId).classList.add('active');
      });
    });
  }

  generateReports(modal, stateManager) {
    const state = stateManager.getState();
    const filteredCards = this.getFilteredCardsForReports(state);
    
    this.generateColumnReport(modal.querySelector('#reportColumns'), state, filteredCards);
    this.generateLaneReport(modal.querySelector('#reportLanes'), state, filteredCards);
    this.generateAssigneeReport(modal.querySelector('#reportAssignees'), state, filteredCards);
    this.generateChartsReport(modal.querySelector('#reportCharts'), state, filteredCards);
  }

  getFilteredCardsForReports(state) {
    return state.cards.filter(card => {
      const filter = state.filter;
      
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const searchableText = [
          card.title || '',
          card.assignee || '',
          card.desc || ''
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }
      
      if (filter.laneIds && filter.laneIds.length > 0) {
        if (!filter.laneIds.includes(card.laneId)) return false;
      }
      
      if (filter.tags && filter.tags.length > 0) {
        const cardTags = card.tags || [];
        if (!filter.tags.every(tag => cardTags.includes(tag))) return false;
      }
      
      if (filter.tools && filter.tools.length > 0) {
        const cardTools = card.tools || [];
        if (!filter.tools.every(tool => cardTools.includes(tool))) return false;
      }
      
      return true;
    });
  }

  generateColumnReport(container, state, filteredCards) {
    let html = '<h3>Relatório por Coluna</h3>';
    
    state.columns.forEach(column => {
      const columnCards = filteredCards.filter(card => card.columnId === column.id);
      const totalCost = this.calculateTotalCost(columnCards, state);
      const totalDuration = this.calculateTotalDuration(columnCards);
      
      html += `
        <div class="report-section">
          <div class="report-section-header">
            ${Utils.escapeHtml(column.title)} - ${Utils.formatMin(totalDuration)} - ${totalCost}
          </div>
          <div class="report-section-content">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th>Card</th>
                  <th>Responsável</th>
                  <th>Duração</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      columnCards.forEach(card => {
        const lane = state.lanes.find(l => l.id === card.laneId);
        const cardCost = this.parseCardCost(card.cost);
        html += `
          <tr>
            <td>${Utils.escapeHtml(lane ? lane.title : 'N/A')}</td>
            <td>${Utils.escapeHtml(card.title)}</td>
            <td>${Utils.escapeHtml(card.assignee || 'Não atribuído')}</td>
            <td>${Utils.formatMin(Utils.parseDurationToMin(card.duration))}</td>
            <td>${cardCost}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div></div>';
    });
    
    container.innerHTML = html;
  }

  generateLaneReport(container, state, filteredCards) {
    let html = '<h3>Relatório por Lane</h3>';
    
    state.lanes.forEach(lane => {
      const laneCards = filteredCards.filter(card => card.laneId === lane.id);
      const totalCost = this.calculateTotalCost(laneCards, state);
      const totalDuration = this.calculateTotalDuration(laneCards);
      
      html += `
        <div class="report-section">
          <div class="report-section-header">
            ${Utils.escapeHtml(lane.title)} - ${Utils.formatMin(totalDuration)} - ${totalCost}
          </div>
          <div class="report-section-content">
            <table class="report-table">
              <thead>
                <tr>
                  <th>Coluna</th>
                  <th>Card</th>
                  <th>Responsável</th>
                  <th>Duração</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      laneCards.forEach(card => {
        const column = state.columns.find(c => c.id === card.columnId);
        const cardCost = this.parseCardCost(card.cost);
        html += `
          <tr>
            <td>${Utils.escapeHtml(column ? column.title : 'N/A')}</td>
            <td>${Utils.escapeHtml(card.title)}</td>
            <td>${Utils.escapeHtml(card.assignee || 'Não atribuído')}</td>
            <td>${Utils.formatMin(Utils.parseDurationToMin(card.duration))}</td>
            <td>${cardCost}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div></div>';
    });
    
    container.innerHTML = html;
  }

  generateAssigneeReport(container, state, filteredCards) {
    let html = '<h3>Relatório por Responsável</h3>';
    
    const assigneeGroups = {};
    filteredCards.forEach(card => {
      const assignee = card.assignee || 'Não atribuído';
      if (!assigneeGroups[assignee]) {
        assigneeGroups[assignee] = [];
      }
      assigneeGroups[assignee].push(card);
    });
    
    Object.entries(assigneeGroups).forEach(([assigneeName, cards]) => {
      const totalCost = this.calculateTotalCost(cards, state);
      const totalDuration = this.calculateTotalDuration(cards);
      
      html += `
        <div class="report-section">
          <div class="report-section-header">
            ${Utils.escapeHtml(assigneeName)} - ${Utils.formatMin(totalDuration)} - ${totalCost}
          </div>
          <div class="report-section-content">
            <h4>Por Lane:</h4>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Lane</th>
                  <th>Cards</th>
                  <th>Duração Total</th>
                  <th>Custo Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      const laneGroups = {};
      cards.forEach(card => {
        const laneId = card.laneId;
        if (!laneGroups[laneId]) laneGroups[laneId] = [];
        laneGroups[laneId].push(card);
      });
      
      Object.entries(laneGroups).forEach(([laneId, laneCards]) => {
        const lane = state.lanes.find(l => l.id === laneId);
        const laneCost = this.calculateTotalCost(laneCards, state);
        const laneDuration = this.calculateTotalDuration(laneCards);
        
        html += `
          <tr>
            <td>${Utils.escapeHtml(lane ? lane.title : 'N/A')}</td>
            <td>${laneCards.length}</td>
            <td>${Utils.formatMin(laneDuration)}</td>
            <td>${laneCost}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table>';
      
      html += `
            <h4>Por Coluna:</h4>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Coluna</th>
                  <th>Cards</th>
                  <th>Duração Total</th>
                  <th>Custo Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      const columnGroups = {};
      cards.forEach(card => {
        const columnId = card.columnId;
        if (!columnGroups[columnId]) columnGroups[columnId] = [];
        columnGroups[columnId].push(card);
      });
      
      Object.entries(columnGroups).forEach(([columnId, columnCards]) => {
        const column = state.columns.find(c => c.id === columnId);
        const columnCost = this.calculateTotalCost(columnCards, state);
        const columnDuration = this.calculateTotalDuration(columnCards);
        
        html += `
          <tr>
            <td>${Utils.escapeHtml(column ? column.title : 'N/A')}</td>
            <td>${columnCards.length}</td>
            <td>${Utils.formatMin(columnDuration)}</td>
            <td>${columnCost}</td>
          </tr>
        `;
      });
      
      html += '</tbody></table></div></div>';
    });
    
    container.innerHTML = html;
  }

  generateChartsReport(container, state, filteredCards) {
    let html = '<h3>Gráficos de Duração e Custo</h3>';
    
    html += '<h4>Por Coluna</h4><div class="chart-container">';
    const columnData = this.calculateColumnData(state, filteredCards);
    const maxColumnCost = Math.max(...columnData.map(d => d.cost));
    
    columnData.forEach(data => {
      const percentage = maxColumnCost > 0 ? (data.cost / maxColumnCost) * 100 : 0;
      html += `
        <div class="chart-bar">
          <div class="chart-label">${Utils.escapeHtml(data.name)}</div>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="chart-value">R$ ${data.cost.toFixed(2)}</div>
        </div>
      `;
    });
    html += '</div>';
    
    html += '<h4>Por Lane</h4><div class="chart-container">';
    const laneData = this.calculateLaneData(state, filteredCards);
    const maxLaneCost = Math.max(...laneData.map(d => d.cost));
    
    laneData.forEach(data => {
      const percentage = maxLaneCost > 0 ? (data.cost / maxLaneCost) * 100 : 0;
      html += `
        <div class="chart-bar">
          <div class="chart-label">${Utils.escapeHtml(data.name)}</div>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="chart-value">R$ ${data.cost.toFixed(2)}</div>
        </div>
      `;
    });
    html += '</div>';
    
    html += '<h4>Por Responsável</h4><div class="chart-container">';
    const assigneeData = this.calculateAssigneeData(state, filteredCards);
    const maxAssigneeCost = Math.max(...assigneeData.map(d => d.cost));
    
    assigneeData.forEach(data => {
      const percentage = maxAssigneeCost > 0 ? (data.cost / maxAssigneeCost) * 100 : 0;
      html += `
        <div class="chart-bar">
          <div class="chart-label">${Utils.escapeHtml(data.name)}</div>
          <div class="chart-bar-bg">
            <div class="chart-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="chart-value">R$ ${data.cost.toFixed(2)}</div>
        </div>
      `;
    });
    html += '</div>';
    
    container.innerHTML = html;
  }

  calculateTotalCost(cards, state) {
    const total = cards.reduce((sum, card) => {
      const cost = this.parseCardCost(card.cost);
      return sum + (parseFloat(cost.replace(/[R$\s]/g, '').replace(',', '.')) || 0);
    }, 0);
    return `R$ ${total.toFixed(2)}`;
  }

  calculateTotalDuration(cards) {
    return cards.reduce((sum, card) => {
      return sum + Utils.parseDurationToMin(card.duration);
    }, 0);
  }

  parseCardCost(cost) {
    if (!cost) return 'R$ 0,00';
    if (cost.startsWith('R$')) return cost;
    return `R$ ${parseFloat(cost).toFixed(2)}`;
  }

  calculateColumnData(state, filteredCards) {
    return state.columns.map(column => {
      const columnCards = filteredCards.filter(card => card.columnId === column.id);
      const cost = columnCards.reduce((sum, card) => {
        const cardCost = this.parseCardCost(card.cost);
        return sum + (parseFloat(cardCost.replace(/[R$\s]/g, '').replace(',', '.')) || 0);
      }, 0);
      return { name: column.title, cost };
    });
  }

  calculateLaneData(state, filteredCards) {
    return state.lanes.map(lane => {
      const laneCards = filteredCards.filter(card => card.laneId === lane.id);
      const cost = laneCards.reduce((sum, card) => {
        const cardCost = this.parseCardCost(card.cost);
        return sum + (parseFloat(cardCost.replace(/[R$\s]/g, '').replace(',', '.')) || 0);
      }, 0);
      return { name: lane.title, cost };
    });
  }

  calculateAssigneeData(state, filteredCards) {
    const assigneeGroups = {};
    filteredCards.forEach(card => {
      const assignee = card.assignee || 'Não atribuído';
      if (!assigneeGroups[assignee]) assigneeGroups[assignee] = [];
      assigneeGroups[assignee].push(card);
    });
    
    return Object.entries(assigneeGroups).map(([name, cards]) => {
      const cost = cards.reduce((sum, card) => {
        const cardCost = this.parseCardCost(card.cost);
        return sum + (parseFloat(cardCost.replace(/[R$\s]/g, '').replace(',', '.')) || 0);
      }, 0);
      return { name, cost };
    });
  }

  openToolsManager(stateManager) {
    const modal = this.createToolsManagerModal(stateManager);
    this.openModal(modal);
  }

  createToolsManagerModal(stateManager) {
    const modal = Utils.createElement('div', 'modal');
    const toolDict = stateManager.getToolDict();
    
    modal.innerHTML = `
      <header><div class="modal-title">Gerenciar Tecnologias</div></header>
      <div class="modal-body">
        <div id="toolRows"></div>
        <button class="btn success" id="add">+ Adicionar Tecnologia</button>
      </div>
      <footer>
        <button class="btn" id="close">Fechar</button>
        <button class="btn success" id="save">Salvar</button>
      </footer>
    `;

    const rowsContainer = modal.querySelector('#toolRows');
    
    toolDict.forEach(tool => this.addToolRow(rowsContainer, tool));
    
    modal.querySelector('#add').addEventListener('click', () => {
      this.addToolRow(rowsContainer);
    });

    modal.querySelector('#close').addEventListener('click', () => {
      this.closeModal();
    });

    modal.querySelector('#save').addEventListener('click', () => {
      const tools = this.collectToolsFromRows(rowsContainer);
      stateManager.updateToolDict(tools);
      this.closeModal();
    });

    return modal;
  }

  addToolRow(container, value = '') {
    const row = Utils.createElement('div', 'row');
    row.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
        <input class="tl-name" placeholder="Tecnologia" value="${Utils.escapeHtml(value)}" />
        <button class="btn small danger tl-del">X</button>
      </div>
    `;
    
    row.querySelector('.tl-del').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  collectToolsFromRows(container) {
    return Utils.qsa('.row', container)
      .map(row => row.querySelector('.tl-name').value.trim())
      .filter(Boolean);
  }
}