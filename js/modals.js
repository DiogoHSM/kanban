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
    
    // Adicionar ferramentas existentes
    toolDict.forEach(tool => this.addToolRow(rowsContainer, tool));
    
    // Event listeners
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