// js/drag-drop.js - Funcionalidade de drag & drop
export class DragDropManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.draggedCardId = null;
    this.renderCallback = null;
  }

  setup(renderCallback) {
    this.renderCallback = renderCallback;
    
    // Event delegation para cards e drop zones
    document.addEventListener('dragstart', (e) => this.handleDragStart(e));
    document.addEventListener('dragover', (e) => this.handleDragOver(e));
    document.addEventListener('dragenter', (e) => this.handleDragEnter(e));
    document.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    document.addEventListener('drop', (e) => this.handleDrop(e));
    document.addEventListener('dragend', (e) => this.handleDragEnd(e));
  }

  handleDragStart(e) {
    const card = e.target.closest('.card');
    if (!card) return;

    this.draggedCardId = card.dataset.cardId;
    
    if (!this.draggedCardId) return;

    // Configurar dados do drag
    e.dataTransfer.setData('text/card-id', this.draggedCardId);
    e.dataTransfer.effectAllowed = 'move';
    
    // Adicionar classe visual ao card sendo arrastado
    card.classList.add('dragging');
    
    // Destacar drop zones válidos
    this.highlightDropZones(true);
  }

  handleDragOver(e) {
    const dropZone = e.target.closest('[data-drop-target]');
    if (!dropZone) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    const dropZone = e.target.closest('[data-drop-target]');
    if (!dropZone) return;

    e.preventDefault();
    dropZone.classList.add('drop-target');
  }

  handleDragLeave(e) {
    const dropZone = e.target.closest('[data-drop-target]');
    if (!dropZone) return;

    // Verificar se realmente saiu da zona (e não de um elemento filho)
    if (!dropZone.contains(e.relatedTarget)) {
      dropZone.classList.remove('drop-target');
    }
  }

  handleDrop(e) {
    const dropZone = e.target.closest('[data-drop-target]');
    if (!dropZone) return;

    e.preventDefault();
    dropZone.classList.remove('drop-target');

    const cardId = e.dataTransfer.getData('text/card-id');
    if (!cardId) return;

    const laneId = dropZone.dataset.laneId;
    const columnId = dropZone.dataset.columnId;

    if (laneId && columnId) {
      this.moveCard(cardId, laneId, columnId);
    }
  }

  handleDragEnd(e) {
    // Limpar classes visuais
    const draggedCard = document.querySelector('.card.dragging');
    if (draggedCard) {
      draggedCard.classList.remove('dragging');
    }

    // Remover highlight das drop zones
    this.highlightDropZones(false);
    
    // Limpar drop targets ativos
    document.querySelectorAll('.drop-target').forEach(zone => {
      zone.classList.remove('drop-target');
    });

    this.draggedCardId = null;
  }

  highlightDropZones(highlight) {
    const dropZones = document.querySelectorAll('[data-drop-target]');
    dropZones.forEach(zone => {
      if (highlight) {
        zone.classList.add('drop-zone-active');
      } else {
        zone.classList.remove('drop-zone-active');
      }
    });
  }

  moveCard(cardId, newLaneId, newColumnId) {
    const card = this.stateManager.getCards().find(c => c.id === cardId);
    if (!card) return;

    // Verificar se realmente mudou de posição
    if (card.laneId === newLaneId && card.columnId === newColumnId) {
      return;
    }

    // Mover card no estado
    this.stateManager.moveCard(cardId, {
      laneId: newLaneId,
      columnId: newColumnId
    });

    // Log da ação para debug
    console.log(`Card "${card.title}" moved to lane ${newLaneId}, column ${newColumnId}`);
  }

  // Métodos utilitários para drag & drop avançado
  
  enableSortableCards() {
    // Implementação futura para reordenar cards dentro de uma coluna
    // Pode usar bibliotecas como SortableJS se necessário
  }

  addDragPreview(cardElement) {
    // Criar preview customizado durante o drag
    const preview = cardElement.cloneNode(true);
    preview.style.transform = 'rotate(5deg)';
    preview.style.opacity = '0.8';
    return preview;
  }

  validateDrop(cardId, targetLaneId, targetColumnId) {
    // Validações customizadas para permitir/negar drops
    const card = this.stateManager.getCards().find(c => c.id === cardId);
    const lanes = this.stateManager.getLanes();
    const columns = this.stateManager.getColumns();

    // Verificar se lane e column existem
    const targetLane = lanes.find(l => l.id === targetLaneId);
    const targetColumn = columns.find(c => c.id === targetColumnId);

    if (!targetLane || !targetColumn) {
      return false;
    }

    // Adicionar lógica de validação customizada aqui
    // Por exemplo, regras de negócio específicas
    
    return true;
  }

  // Suporte para touch devices (mobile)
  setupTouchEvents() {
    let touchItem = null;
    let touchOffset = { x: 0, y: 0 };

    document.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.card');
      if (!card) return;

      touchItem = card;
      const touch = e.touches[0];
      const rect = card.getBoundingClientRect();
      
      touchOffset.x = touch.clientX - rect.left;
      touchOffset.y = touch.clientY - rect.top;

      card.style.position = 'fixed';
      card.style.zIndex = '1000';
      card.style.pointerEvents = 'none';
    });

    document.addEventListener('touchmove', (e) => {
      if (!touchItem) return;
      
      e.preventDefault();
      const touch = e.touches[0];
      
      touchItem.style.left = (touch.clientX - touchOffset.x) + 'px';
      touchItem.style.top = (touch.clientY - touchOffset.y) + 'px';

      // Highlight drop zone under touch
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementBelow?.closest('[data-drop-target]');
      
      document.querySelectorAll('.drop-target').forEach(zone => {
        zone.classList.remove('drop-target');
      });
      
      if (dropZone) {
        dropZone.classList.add('drop-target');
      }
    });

    document.addEventListener('touchend', (e) => {
      if (!touchItem) return;

      const touch = e.changedTouches[0];
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      const dropZone = elementBelow?.closest('[data-drop-target]');

      if (dropZone) {
        const cardId = touchItem.dataset.cardId || this.draggedCardId;
        const laneId = dropZone.dataset.laneId;
        const columnId = dropZone.dataset.columnId;

        if (cardId && laneId && columnId) {
          this.moveCard(cardId, laneId, columnId);
        }
      }

      // Reset styles
      touchItem.style.position = '';
      touchItem.style.zIndex = '';
      touchItem.style.left = '';
      touchItem.style.top = '';
      touchItem.style.pointerEvents = '';

      // Clear highlights
      document.querySelectorAll('.drop-target').forEach(zone => {
        zone.classList.remove('drop-target');
      });

      touchItem = null;
    });
  }

  // Undo/Redo para drag & drop
  addUndoSupport() {
    // Implementação futura para desfazer movimentações
    // Manter histórico de movimentações
  }
}