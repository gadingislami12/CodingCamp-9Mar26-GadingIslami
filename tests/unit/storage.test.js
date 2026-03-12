import { describe, it, expect, beforeEach, vi } from 'vitest';

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

describe('Storage Utility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('get method', () => {
    it('should return null when key does not exist', () => {
      const result = Storage.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should retrieve and parse stored data', () => {
      const testData = { name: 'Test', value: 123 };
      localStorage.setItem('testKey', JSON.stringify(testData));
      
      const result = Storage.get('testKey');
      expect(result).toEqual(testData);
    });

    it('should return null and log error for invalid JSON', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('badKey', 'invalid json {');
      
      const result = Storage.get('badKey');
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle arrays correctly', () => {
      const testArray = [1, 2, 3, 4, 5];
      localStorage.setItem('arrayKey', JSON.stringify(testArray));
      
      const result = Storage.get('arrayKey');
      expect(result).toEqual(testArray);
    });
  });

  describe('set method', () => {
    it('should store data and return true on success', () => {
      const testData = { task: 'Complete project', completed: false };
      
      const result = Storage.set('taskKey', testData);
      expect(result).toBe(true);
      
      const stored = localStorage.getItem('taskKey');
      expect(JSON.parse(stored)).toEqual(testData);
    });

    it('should serialize arrays correctly', () => {
      const testArray = [{ id: 1 }, { id: 2 }];
      
      const result = Storage.set('arrayKey', testArray);
      expect(result).toBe(true);
      
      const stored = localStorage.getItem('arrayKey');
      expect(JSON.parse(stored)).toEqual(testArray);
    });

    it('should handle primitive values', () => {
      Storage.set('stringKey', 'test string');
      Storage.set('numberKey', 42);
      Storage.set('boolKey', true);
      
      expect(Storage.get('stringKey')).toBe('test string');
      expect(Storage.get('numberKey')).toBe(42);
      expect(Storage.get('boolKey')).toBe(true);
    });
  });

  describe('remove method', () => {
    it('should remove data and return true on success', () => {
      localStorage.setItem('removeKey', JSON.stringify({ data: 'test' }));
      
      const result = Storage.remove('removeKey');
      expect(result).toBe(true);
      expect(localStorage.getItem('removeKey')).toBeNull();
    });

    it('should return true even if key does not exist', () => {
      const result = Storage.remove('nonexistent');
      expect(result).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage quota exceeded error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      };
      
      const result = Storage.set('key', 'value');
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
    });
  });
});
