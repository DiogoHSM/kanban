// js/theme.js - Gerenciamento de temas
const THEME_KEY = 'kanban-theme';

export class ThemeManager {
  constructor() {
    this.currentTheme = this.loadTheme();
  }

  loadTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  applyTheme(theme) {
    if (!['light', 'dark'].includes(theme)) {
      console.warn('Invalid theme:', theme);
      theme = 'dark';
    }

    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.saveTheme(theme);
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme } 
    }));
  }

  saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    return newTheme;
  }

  // Detect system preference
  getSystemPreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Auto-apply system theme
  syncWithSystemPreference() {
    const systemTheme = this.getSystemPreference();
    this.applyTheme(systemTheme);
    
    // Listen for system changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(newTheme);
      });
    }
  }
}