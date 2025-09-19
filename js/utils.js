// js/utils.js - Funções utilitárias
export class Utils {
  // Geração de IDs únicos
  static uid() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : 'id-' + Math.random().toString(36).slice(2);
  }

  // Seletores DOM
  static qs(selector, element = document) {
    return element.querySelector(selector);
  }

  static qsa(selector, element = document) {
    return Array.from(element.querySelectorAll(selector));
  }

  // Escape HTML para prevenir XSS
  static escapeHtml(str) {
    return (str ?? '').toString().replace(/[&<>"]/g, match => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[match]));
  }

  // Parsing e formatação de duração
  static parseDurationToMin(text) {
    if (!text) return 0;
    
    let s = String(text).trim().toLowerCase().replace(/,/g, '.');
    
    // Pattern "H:M" -> hours + minutes
    const hm = s.match(/^(\d{1,3}):(\d{1,2})$/);
    if (hm) {
      const h = +hm[1], m = +hm[2];
      return h * 60 + m;
    }
    
    // Tokens like 1.5h 30m 2d 1w
    let total = 0;
    let matched = false;
    
    s.replace(/(\d+(?:\.\d+)?)\s*(w|sem|semanas?|d|dias?|day|h|hr|hrs|horas?|m|min|mins|minutos?)/g, 
      (match, num, unit) => {
        matched = true;
        const n = parseFloat(num);
        
        if (/w|sem|semanas?/.test(unit)) {
          total += n * 5 * 8 * 60; // semana = 5 dias úteis de 8h
        } else if (/d|dias?|day/.test(unit)) {
          total += n * 8 * 60; // dia = 8h
        } else if (/h|hr|hrs|horas?/.test(unit)) {
          total += n * 60;
        } else {
          total += n; // minutos
        }
        
        return '';
      }
    );
    
    if (matched) return Math.round(total);
    
    // Plain number -> hours
    const num = parseFloat(s);
    if (!isNaN(num)) return Math.round(num * 60);
    
    return 0;
  }

  static formatMin(total) {
    total = Math.max(0, Math.round(total));
    const MIN_PER_DAY = 8 * 60;
    
    const d = Math.floor(total / MIN_PER_DAY);
    total %= MIN_PER_DAY;
    const h = Math.floor(total / 60);
    const m = total % 60;
    
    let out = [];
    if (d) out.push(d + 'd');
    if (h) out.push(h + 'h');
    if (m || out.length === 0) out.push(m + 'm');
    
    return out.join(' ');
  }

  // Criação de elementos
  static createElement(tag, className = '', textContent = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  static createButton(text, onClick, className = '') {
    const btn = this.createElement('button', `btn ${className}`, text);
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
  }

  static createChip(text) {
    return this.createElement('span', 'chip', text);
  }

  // Debounce para otimização
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Validação de dados
  static isValidCard(card) {
    return card && 
           typeof card.id === 'string' && 
           typeof card.title === 'string' &&
           typeof card.laneId === 'string' &&
           typeof card.columnId === 'string';
  }

  static isValidLane(lane) {
    return lane && 
           typeof lane.id === 'string' && 
           typeof lane.title === 'string';
  }

  static isValidColumn(column) {
    return column && 
           typeof column.id === 'string' && 
           typeof column.title === 'string';
  }

  // Testes automatizados
  static runSelfTests() {
    try {
      console.assert(this.escapeHtml('<>') === '&lt;&gt;', 'escapeHtml test');
      console.assert(this.parseDurationToMin('2h 30m') === 150, 'parse 2h 30m');
      console.assert(this.parseDurationToMin('1.5h') === 90, 'parse 1.5h');
      console.assert(this.parseDurationToMin('90m') === 90, 'parse 90m');
      console.assert(this.parseDurationToMin('1:45') === 105, 'parse 1:45');
      console.assert(this.parseDurationToMin('3') === 180, 'parse plain hours');
      console.assert(this.parseDurationToMin('2d') === 16 * 60, 'parse 2d as 16h');
      console.assert(this.formatMin(20 * 60) === '2d 4h', 'format 20h as 2d 4h');
      console.log('✅ All utils tests passed');
    } catch (e) {
      console.warn('⚠️ Utils self-tests warning:', e);
    }
  }
}