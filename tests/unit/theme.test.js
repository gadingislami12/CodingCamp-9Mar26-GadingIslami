import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Setup DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <button id="theme-toggle-btn"></button>
    </body>
  </html>
`);

global.document = dom.window.document;
global.localStorage = localStorageMock;

// Import Storage utility
const Storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
      return false;
    }
  }
};

// Theme Component
const ThemeComponent = {
  currentTheme: 'light',
  
  init() {
    this.toggleButton = document.getElementById('theme-toggle-btn');
    this.loadTheme();
    this.applyTheme();
  },
  
  loadTheme() {
    const savedTheme = Storage.get('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme;
    } else {
      this.currentTheme = 'light';
    }
  },
  
  applyTheme() {
    if (this.currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.toggleButton.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      this.toggleButton.textContent = '🌙';
    }
  },
  
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveTheme();
  },
  
  saveTheme() {
    Storage.set('theme', this.currentTheme);
  }
};

describe('Theme Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    ThemeComponent.currentTheme = 'light';
  });

  describe('initialization', () => {
    it('should initialize with light theme by default', () => {
      ThemeComponent.init();
      expect(ThemeComponent.currentTheme).toBe('light');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('should load saved light theme from storage', () => {
      Storage.set('theme', 'light');
      ThemeComponent.init();
      expect(ThemeComponent.currentTheme).toBe('light');
    });

    it('should load saved dark theme from storage', () => {
      Storage.set('theme', 'dark');
      ThemeComponent.init();
      expect(ThemeComponent.currentTheme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should default to light theme if storage contains invalid value', () => {
      Storage.set('theme', 'invalid');
      ThemeComponent.init();
      expect(ThemeComponent.currentTheme).toBe('light');
    });

    it('should default to light theme if storage is empty', () => {
      ThemeComponent.init();
      expect(ThemeComponent.currentTheme).toBe('light');
    });
  });

  describe('theme application', () => {
    beforeEach(() => {
      ThemeComponent.init();
    });

    it('should apply light theme correctly', () => {
      ThemeComponent.currentTheme = 'light';
      ThemeComponent.applyTheme();
      
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
      expect(ThemeComponent.toggleButton.textContent).toBe('🌙');
    });

    it('should apply dark theme correctly', () => {
      ThemeComponent.currentTheme = 'dark';
      ThemeComponent.applyTheme();
      
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(ThemeComponent.toggleButton.textContent).toBe('☀️');
    });
  });

  describe('theme toggling', () => {
    beforeEach(() => {
      ThemeComponent.init();
    });

    it('should toggle from light to dark', () => {
      ThemeComponent.currentTheme = 'light';
      ThemeComponent.toggleTheme();
      
      expect(ThemeComponent.currentTheme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(Storage.get('theme')).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      ThemeComponent.currentTheme = 'dark';
      ThemeComponent.toggleTheme();
      
      expect(ThemeComponent.currentTheme).toBe('light');
      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
      expect(Storage.get('theme')).toBe('light');
    });

    it('should save theme to storage after toggle', () => {
      ThemeComponent.currentTheme = 'light';
      ThemeComponent.toggleTheme();
      
      const savedTheme = Storage.get('theme');
      expect(savedTheme).toBe('dark');
    });
  });

  describe('theme persistence', () => {
    it('should persist light theme selection', () => {
      ThemeComponent.init();
      ThemeComponent.currentTheme = 'light';
      ThemeComponent.saveTheme();
      
      expect(Storage.get('theme')).toBe('light');
    });

    it('should persist dark theme selection', () => {
      ThemeComponent.init();
      ThemeComponent.currentTheme = 'dark';
      ThemeComponent.saveTheme();
      
      expect(Storage.get('theme')).toBe('dark');
    });

    it('should restore theme on page reload', () => {
      // Simulate first visit - set dark theme
      ThemeComponent.init();
      ThemeComponent.currentTheme = 'dark';
      ThemeComponent.saveTheme();
      
      // Simulate page reload - reset component
      ThemeComponent.currentTheme = 'light';
      document.documentElement.removeAttribute('data-theme');
      
      // Initialize again (simulating reload)
      ThemeComponent.init();
      
      expect(ThemeComponent.currentTheme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple toggles correctly', () => {
      ThemeComponent.init();
      
      ThemeComponent.toggleTheme(); // light -> dark
      expect(ThemeComponent.currentTheme).toBe('dark');
      
      ThemeComponent.toggleTheme(); // dark -> light
      expect(ThemeComponent.currentTheme).toBe('light');
      
      ThemeComponent.toggleTheme(); // light -> dark
      expect(ThemeComponent.currentTheme).toBe('dark');
      
      expect(Storage.get('theme')).toBe('dark');
    });

    it('should handle missing toggle button gracefully', () => {
      const button = document.getElementById('theme-toggle-btn');
      button.remove();
      
      expect(() => {
        ThemeComponent.init();
      }).toThrow();
    });
  });
});
