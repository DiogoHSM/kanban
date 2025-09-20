// js/import-export.js - Gerenciamento de importação/exportação
import { Utils } from './utils.js';

export class ImportExportManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.fileInput = document.getElementById('fileInput');
    this.setupFileInput();
  }

  setupFileInput() {
    this.fileInput.addEventListener('change', (e) => {
      this.handleFileImport(e);
    });
  }

  exportJSON() {
    try {
      const state = this.stateManager.getState();
      const data = JSON.stringify(state, null, 2);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFileName();
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      console.log('Export successful');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erro ao exportar arquivo: ' + error.message);
    }
  }

  generateFileName() {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
    return `kanban-board-${timestamp}.json`;
  }

  importJSONPrompt() {
    this.fileInput.value = '';
    this.fileInput.click();
  }

  async handleFileImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const text = await this.readFile(file);
      const data = this.parseJSON(text);
      const validatedData = this.validateAndConvert(data);
      
      if (this.confirmImport()) {
        // Debug: Log do que está sendo importado
        console.log('Importando dados:', validatedData);
        console.log('AssigneeDict no import:', validatedData.assigneeDict);
        
        this.stateManager.setState(validatedData);
        
        // Verificar se foi salvo corretamente
        setTimeout(() => {
          const currentState = this.stateManager.getState();
          console.log('Estado após import:', currentState);
          console.log('AssigneeDict no estado:', currentState.assigneeDict);
        }, 100);
        
        alert('Importação realizada com sucesso!');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Falha ao importar: ' + error.message);
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };
      
      reader.readAsText(file);
    });
  }

  parseJSON(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error('Arquivo JSON inválido');
    }
  }

  validateAndConvert(data) {
    // Verificar se é formato novo ou antigo
    if (this.isNewFormat(data)) {
      return this.validateNewFormat(data);
    } else if (this.isOldFormat(data)) {
      return this.convertOldFormat(data);
    } else {
      throw new Error('Formato de arquivo não reconhecido');
    }
  }

  isNewFormat(data) {
    const hasRequiredFields = data && 
           typeof data === 'object' && 
           Array.isArray(data.columns) && 
           Array.isArray(data.lanes) && 
           Array.isArray(data.cards);
    
    console.log('Verificando formato novo:', hasRequiredFields, data);
    return hasRequiredFields;
  }

  isOldFormat(data) {
    return Array.isArray(data) && 
           data.length > 0 && 
           data[0].hasOwnProperty('title') &&
           (data[0].hasOwnProperty('cards') || data[0].hasOwnProperty('id'));
  }

  validateNewFormat(data) {
    const validatedData = {
      columns: this.validateColumns(data.columns),
      lanes: this.validateLanes(data.lanes),
      cards: this.validateCards(data.cards),
      tagDict: this.validateTagDict(data.tagDict),
      toolDict: this.validateToolDict(data.toolDict),
      assigneeDict: this.validateAssigneeDict(data.assigneeDict),
      filter: this.validateFilter(data.filter)
    };

    return validatedData;
  }

  validateColumns(columns) {
    if (!Array.isArray(columns)) return [];
    
    return columns.filter(col => {
      return Utils.isValidColumn(col);
    }).map(col => ({
      id: col.id || Utils.uid(),
      title: String(col.title || 'Coluna')
    }));
  }

  validateLanes(lanes) {
    if (!Array.isArray(lanes) || lanes.length === 0) {
      return [{ id: Utils.uid(), title: 'Geral' }];
    }
    
    return lanes.filter(lane => {
      return Utils.isValidLane(lane);
    }).map(lane => ({
      id: lane.id || Utils.uid(),
      title: String(lane.title || 'Lane')
    }));
  }

  validateCards(cards) {
    if (!Array.isArray(cards)) return [];
    
    return cards.filter(card => {
      return Utils.isValidCard(card);
    }).map(card => ({
      id: card.id || Utils.uid(),
      title: String(card.title || 'Card'),
      assignee: String(card.assignee || ''),
      duration: String(card.duration || ''),
      cost: String(card.cost || ''),
      tools: Array.isArray(card.tools) ? card.tools : [],
      tags: Array.isArray(card.tags) ? card.tags : [],
      color: String(card.color || '#7c9fff'),
      desc: String(card.desc || ''),
      laneId: String(card.laneId),
      columnId: String(card.columnId)
    }));
  }

  validateTagDict(tagDict) {
    if (!Array.isArray(tagDict)) return [];
    
    return tagDict.filter(tag => {
      return tag && 
             typeof tag === 'object' && 
             typeof tag.name === 'string' && 
             tag.name.length > 0;
    }).map(tag => ({
      name: String(tag.name),
      color: String(tag.color || '#888888')
    }));
  }

  validateToolDict(toolDict) {
    if (!Array.isArray(toolDict)) return [];
    
    return toolDict.filter(tool => {
      return typeof tool === 'string' && tool.length > 0;
    }).map(tool => String(tool));
  }

  validateAssigneeDict(assigneeDict) {
    if (!Array.isArray(assigneeDict)) {
      console.log('assigneeDict não é array:', assigneeDict);
      return [];
    }
    
    console.log('Validando assigneeDict:', assigneeDict);
    
    const validated = assigneeDict.filter(assignee => {
      const isValid = assignee && 
             typeof assignee === 'object' && 
             typeof assignee.name === 'string' && 
             assignee.name.length > 0 &&
             (typeof assignee.hourlyRate === 'number' || typeof assignee.hourlyRate === 'string') &&
             Number(assignee.hourlyRate) > 0;
      
      if (!isValid) {
        console.log('Responsável inválido:', assignee);
      }
      return isValid;
    }).map(assignee => ({
      name: String(assignee.name),
      hourlyRate: Number(assignee.hourlyRate)
    }));
    
    console.log('AssigneeDict validado:', validated);
    return validated;
  }

  validateFilter(filter) {
    if (!filter || typeof filter !== 'object') {
      return { tags: [], tools: [], laneIds: [], search: '' };
    }
    
    return {
      tags: Array.isArray(filter.tags) ? filter.tags : [],
      tools: Array.isArray(filter.tools) ? filter.tools : [],
      laneIds: Array.isArray(filter.laneIds) ? filter.laneIds : [],
      search: String(filter.search || '')
    };
  }

  convertOldFormat(oldData) {
    const laneId = Utils.uid();
    const columns = oldData.map(col => ({
      id: col.id || Utils.uid(),
      title: col.title || 'Coluna'
    }));
    
    const lanes = [{ id: laneId, title: 'Geral' }];
    const cards = [];
    
    oldData.forEach(col => {
      const columnId = col.id || columns[0].id;
      (col.cards || []).forEach(card => {
        cards.push({
          id: card.id || Utils.uid(),
          title: card.title || card.name || 'Sem título',
          assignee: card.assignee || '',
          duration: card.duration || '',
          cost: card.cost || '',
          tools: Array.isArray(card.tools) ? card.tools : [],
          tags: Array.isArray(card.tags) ? card.tags : [],
          color: card.color || '#7c9fff',
          desc: card.desc || '',
          laneId: laneId,
          columnId: columnId
        });
      });
    });
    
    return {
      columns,
      lanes,
      cards,
      tagDict: [],
      toolDict: [],
      assigneeDict: [],
      filter: { tags: [], tools: [], laneIds: [], search: '' }
    };
  }

  confirmImport() {
    return confirm(
      'Isso substituirá todos os dados atuais do quadro. ' +
      'Tem certeza que deseja continuar?'
    );
  }

  // Backup automático
  createBackup() {
    try {
      const state = this.stateManager.getState();
      const backup = {
        timestamp: new Date().toISOString(),
        data: state
      };
      
      const backupKey = `kanban-backup-${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Manter apenas os 5 backups mais recentes
      this.cleanupOldBackups();
      
      return backupKey;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return null;
    }
  }

  cleanupOldBackups() {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('kanban-backup-'))
      .sort()
      .reverse();
    
    // Manter apenas os 5 mais recentes
    if (backupKeys.length > 5) {
      backupKeys.slice(5).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  listBackups() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('kanban-backup-'))
      .map(key => {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          return {
            key,
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp).toLocaleString()
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  restoreBackup(backupKey) {
    try {
      const backup = JSON.parse(localStorage.getItem(backupKey));
      if (backup && backup.data) {
        this.stateManager.setState(backup.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      return false;
    }
  }
}