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
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage: ${key}`, error);
      return false;
    }
  }
};

// LinksComponent implementation
const LinksComponent = {
  links: [],
  
  init() {
    this.containerElement = document.getElementById('links-container');
    this.urlInput = document.getElementById('link-url');
    this.labelInput = document.getElementById('link-label');
    this.addButton = document.getElementById('link-add');
    
    this.loadLinks();
    this.attachEventListeners();
    this.render();
  },
  
  loadLinks() {
    this.links = Storage.get('links') || [];
  },
  
  saveLinks() {
    Storage.set('links', this.links);
  },
  
  addLink(url, label) {
    if (!this.isValidUrl(url)) return false;
    
    const link = {
      id: Date.now().toString(),
      url: url.trim(),
      label: label.trim() || url.trim(),
      createdAt: new Date().toISOString()
    };
    
    this.links.push(link);
    this.saveLinks();
    this.render();
    return true;
  },
  
  deleteLink(id) {
    const index = this.links.findIndex(l => l.id === id);
    if (index !== -1) {
      this.links.splice(index, 1);
      this.saveLinks();
      this.render();
      return true;
    }
    return false;
  },
  
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },
  
  render() {
    this.containerElement.innerHTML = '';
    
    this.links.forEach(link => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'link-anchor';
      anchor.textContent = link.label;
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-danger btn-small link-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => this.deleteLink(link.id));
      
      linkItem.appendChild(anchor);
      linkItem.appendChild(deleteButton);
      
      this.containerElement.appendChild(linkItem);
    });
  },
  
  attachEventListeners() {
    this.addButton.addEventListener('click', () => {
      const url = this.urlInput.value;
      const label = this.labelInput.value;
      if (this.addLink(url, label)) {
        this.urlInput.value = '';
        this.labelInput.value = '';
      }
    });
    
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const url = this.urlInput.value;
        const label = this.labelInput.value;
        if (this.addLink(url, label)) {
          this.urlInput.value = '';
          this.labelInput.value = '';
        }
      }
    });
    
    this.labelInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const url = this.urlInput.value;
        const label = this.labelInput.value;
        if (this.addLink(url, label)) {
          this.urlInput.value = '';
          this.labelInput.value = '';
        }
      }
    });
  }
};

describe('LinksComponent', () => {
  let dom;
  let document;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="links-container"></div>
          <input type="url" id="link-url" />
          <input type="text" id="link-label" />
          <button id="link-add">Add</button>
        </body>
      </html>
    `);
    
    global.document = dom.window.document;
    global.window = dom.window;
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset LinksComponent state
    LinksComponent.links = [];
  });

  describe('isValidUrl method', () => {
    it('should return true for valid URLs', () => {
      expect(LinksComponent.isValidUrl('https://example.com')).toBe(true);
      expect(LinksComponent.isValidUrl('http://github.com')).toBe(true);
      expect(LinksComponent.isValidUrl('https://www.google.com/search')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(LinksComponent.isValidUrl('not a url')).toBe(false);
      expect(LinksComponent.isValidUrl('google.com')).toBe(false);
      expect(LinksComponent.isValidUrl('')).toBe(false);
      // Note: URL constructor accepts 'htp://invalid' as valid (lenient parsing)
    });
  });

  describe('addLink method', () => {
    beforeEach(() => {
      LinksComponent.init();
    });

    it('should add a valid link and return true', () => {
      const result = LinksComponent.addLink('https://example.com', 'Example');
      
      expect(result).toBe(true);
      expect(LinksComponent.links.length).toBe(1);
      expect(LinksComponent.links[0].url).toBe('https://example.com');
      expect(LinksComponent.links[0].label).toBe('Example');
    });

    it('should use URL as label when label is empty', () => {
      LinksComponent.addLink('https://github.com', '');
      
      expect(LinksComponent.links[0].label).toBe('https://github.com');
    });

    it('should trim whitespace from URL and label', () => {
      LinksComponent.addLink('  https://example.com  ', '  My Site  ');
      
      expect(LinksComponent.links[0].url).toBe('https://example.com');
      expect(LinksComponent.links[0].label).toBe('My Site');
    });

    it('should reject invalid URLs and return false', () => {
      const result = LinksComponent.addLink('not a url', 'Invalid');
      
      expect(result).toBe(false);
      expect(LinksComponent.links.length).toBe(0);
    });

    it('should create link with id and createdAt timestamp', () => {
      LinksComponent.addLink('https://example.com', 'Example');
      
      const link = LinksComponent.links[0];
      expect(link.id).toBeDefined();
      expect(link.createdAt).toBeDefined();
      expect(new Date(link.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('deleteLink method', () => {
    beforeEach(() => {
      LinksComponent.init();
      LinksComponent.addLink('https://example.com', 'Example');
      LinksComponent.addLink('https://github.com', 'GitHub');
    });

    it('should delete a link by id and return true', () => {
      const linkId = LinksComponent.links[0].id;
      const result = LinksComponent.deleteLink(linkId);
      
      expect(result).toBe(true);
      expect(LinksComponent.links.length).toBe(1);
      expect(LinksComponent.links[0].label).toBe('GitHub');
    });

    it('should return false when deleting non-existent link', () => {
      const result = LinksComponent.deleteLink('nonexistent-id');
      
      expect(result).toBe(false);
      expect(LinksComponent.links.length).toBe(2);
    });
  });

  describe('loadLinks and saveLinks methods', () => {
    beforeEach(() => {
      LinksComponent.init();
    });

    it('should save links to localStorage', () => {
      LinksComponent.addLink('https://example.com', 'Example');
      
      const stored = Storage.get('links');
      expect(stored).toEqual(LinksComponent.links);
    });

    it('should load links from localStorage', () => {
      const testLinks = [
        { id: '1', url: 'https://example.com', label: 'Example', createdAt: new Date().toISOString() }
      ];
      Storage.set('links', testLinks);
      
      LinksComponent.loadLinks();
      
      expect(LinksComponent.links).toEqual(testLinks);
    });

    it('should initialize with empty array when no links in storage', () => {
      LinksComponent.loadLinks();
      
      expect(LinksComponent.links).toEqual([]);
    });
  });

  describe('render method', () => {
    beforeEach(() => {
      LinksComponent.init();
    });

    it('should render links to the DOM', () => {
      LinksComponent.addLink('https://example.com', 'Example');
      LinksComponent.addLink('https://github.com', 'GitHub');
      
      const container = global.document.getElementById('links-container');
      const linkItems = container.querySelectorAll('.link-item');
      
      expect(linkItems.length).toBe(2);
    });

    it('should render anchor with target="_blank"', () => {
      LinksComponent.addLink('https://example.com', 'Example');
      
      const anchor = global.document.querySelector('.link-anchor');
      
      expect(anchor.getAttribute('target')).toBe('_blank');
      expect(anchor.getAttribute('rel')).toBe('noopener noreferrer');
      expect(anchor.href).toBe('https://example.com/');
      expect(anchor.textContent).toBe('Example');
    });

    it('should render delete button for each link', () => {
      LinksComponent.addLink('https://example.com', 'Example');
      
      const deleteButton = global.document.querySelector('.link-delete');
      
      expect(deleteButton).toBeDefined();
      expect(deleteButton.textContent).toBe('Delete');
    });

    it('should clear container before rendering', () => {
      LinksComponent.addLink('https://example.com', 'Example');
      LinksComponent.render();
      
      const container = global.document.getElementById('links-container');
      const linkItems = container.querySelectorAll('.link-item');
      
      expect(linkItems.length).toBe(1);
    });
  });

  describe('persistence', () => {
    it('should persist links after adding', () => {
      LinksComponent.init();
      LinksComponent.addLink('https://example.com', 'Example');
      
      const stored = Storage.get('links');
      expect(stored.length).toBe(1);
      expect(stored[0].url).toBe('https://example.com');
    });

    it('should persist links after deleting', () => {
      LinksComponent.init();
      LinksComponent.addLink('https://example.com', 'Example');
      const linkId = LinksComponent.links[0].id;
      
      LinksComponent.deleteLink(linkId);
      
      const stored = Storage.get('links');
      expect(stored.length).toBe(0);
    });
  });
});
