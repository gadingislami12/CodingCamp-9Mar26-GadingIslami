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

// TasksComponent implementation
const TasksComponent = {
  tasks: [],
  sortEnabled: false,
  
  init() {
    this.listElement = document.getElementById('task-list');
    this.inputElement = document.getElementById('task-input');
    this.addButton = document.getElementById('task-add');
    this.sortButton = document.getElementById('task-sort');
    
    this.loadTasks();
    this.attachEventListeners();
    this.render();
  },
  
  loadTasks() {
    this.tasks = Storage.get('tasks') || [];
  },
  
  saveTasks() {
    Storage.set('tasks', this.tasks);
  },
  
  addTask(text) {
    if (!text || text.trim() === '') return false;
    
    const task = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.tasks.push(task);
    this.sortEnabled = false;
    this.saveTasks();
    this.render();
    return true;
  },
  
  updateTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    if (task && newText.trim() !== '') {
      task.text = newText.trim();
      this.sortEnabled = false;
      this.saveTasks();
      this.render();
      return true;
    }
    return false;
  },
  
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.sortEnabled = false;
      this.saveTasks();
      this.render();
      return true;
    }
    return false;
  },
  
  deleteTask(id) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this.saveTasks();
      this.render();
      return true;
    }
    return false;
  },
  
  sortTasks() {
    this.sortEnabled = true;
    this.render();
  },
  
  getDisplayTasks() {
    if (this.sortEnabled) {
      return [...this.tasks].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }
    return this.tasks;
  },
  
  render() {
    this.listElement.innerHTML = '';
    
    const displayTasks = this.getDisplayTasks();
    
    displayTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      if (task.completed) {
        li.classList.add('completed');
      }
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'task-checkbox';
      checkbox.addEventListener('click', () => this.toggleTask(task.id));
      
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;
      
      const editButton = document.createElement('button');
      editButton.className = 'btn-icon';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null) {
          this.updateTask(task.id, newText);
        }
      });
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-icon btn-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => this.deleteTask(task.id));
      
      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(editButton);
      li.appendChild(deleteButton);
      
      this.listElement.appendChild(li);
    });
  },
  
  attachEventListeners() {
    this.addButton.addEventListener('click', () => {
      const text = this.inputElement.value;
      if (this.addTask(text)) {
        this.inputElement.value = '';
      }
    });
    
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const text = this.inputElement.value;
        if (this.addTask(text)) {
          this.inputElement.value = '';
        }
      }
    });
    
    if (this.sortButton) {
      this.sortButton.addEventListener('click', () => this.sortTasks());
    }
  }
};

describe('TasksComponent', () => {
  let dom;
  let document;

  beforeEach(() => {
    // Reset localStorage
    localStorage.clear();
    
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <input type="text" id="task-input" />
          <button id="task-add">Add</button>
          <ul id="task-list"></ul>
        </body>
      </html>
    `);
    document = dom.window.document;
    global.document = document;
    
    // Reset TasksComponent state
    TasksComponent.tasks = [];
    TasksComponent.sortEnabled = false;
    TasksComponent.listElement = null;
    TasksComponent.inputElement = null;
    TasksComponent.addButton = null;
    TasksComponent.sortButton = null;
  });

  describe('loadTasks', () => {
    it('should load tasks from storage', () => {
      const testTasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', text: 'Task 2', completed: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      Storage.set('tasks', testTasks);
      
      TasksComponent.loadTasks();
      
      expect(TasksComponent.tasks).toEqual(testTasks);
    });

    it('should initialize with empty array if no tasks in storage', () => {
      TasksComponent.loadTasks();
      
      expect(TasksComponent.tasks).toEqual([]);
    });
  });

  describe('saveTasks', () => {
    it('should save tasks to storage', () => {
      TasksComponent.tasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.saveTasks();
      
      const stored = Storage.get('tasks');
      expect(stored).toEqual(TasksComponent.tasks);
    });
  });

  describe('addTask', () => {
    beforeEach(() => {
      TasksComponent.listElement = document.getElementById('task-list');
    });

    it('should add a task with valid text', () => {
      const result = TasksComponent.addTask('New task');
      
      expect(result).toBe(true);
      expect(TasksComponent.tasks.length).toBe(1);
      expect(TasksComponent.tasks[0].text).toBe('New task');
      expect(TasksComponent.tasks[0].completed).toBe(false);
    });

    it('should trim whitespace from task text', () => {
      TasksComponent.addTask('  Task with spaces  ');
      
      expect(TasksComponent.tasks[0].text).toBe('Task with spaces');
    });

    it('should reject empty string', () => {
      const result = TasksComponent.addTask('');
      
      expect(result).toBe(false);
      expect(TasksComponent.tasks.length).toBe(0);
    });

    it('should reject whitespace-only string', () => {
      const result = TasksComponent.addTask('   ');
      
      expect(result).toBe(false);
      expect(TasksComponent.tasks.length).toBe(0);
    });

    it('should persist task to storage', () => {
      TasksComponent.addTask('Persistent task');
      
      const stored = Storage.get('tasks');
      expect(stored.length).toBe(1);
      expect(stored[0].text).toBe('Persistent task');
    });

    it('should generate unique ID for each task', () => {
      TasksComponent.addTask('Task 1');
      TasksComponent.addTask('Task 2');
      
      expect(TasksComponent.tasks[0].id).not.toBe(TasksComponent.tasks[1].id);
    });

    it('should set createdAt timestamp', () => {
      TasksComponent.addTask('Task with timestamp');
      
      expect(TasksComponent.tasks[0].createdAt).toBeDefined();
      expect(new Date(TasksComponent.tasks[0].createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('updateTask', () => {
    beforeEach(() => {
      TasksComponent.listElement = document.getElementById('task-list');
      TasksComponent.tasks = [
        { id: '1', text: 'Original text', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
    });

    it('should update task text', () => {
      const result = TasksComponent.updateTask('1', 'Updated text');
      
      expect(result).toBe(true);
      expect(TasksComponent.tasks[0].text).toBe('Updated text');
    });

    it('should trim whitespace from new text', () => {
      TasksComponent.updateTask('1', '  Updated with spaces  ');
      
      expect(TasksComponent.tasks[0].text).toBe('Updated with spaces');
    });

    it('should reject empty string', () => {
      const result = TasksComponent.updateTask('1', '');
      
      expect(result).toBe(false);
      expect(TasksComponent.tasks[0].text).toBe('Original text');
    });

    it('should reject whitespace-only string', () => {
      const result = TasksComponent.updateTask('1', '   ');
      
      expect(result).toBe(false);
      expect(TasksComponent.tasks[0].text).toBe('Original text');
    });

    it('should return false for non-existent task', () => {
      const result = TasksComponent.updateTask('999', 'New text');
      
      expect(result).toBe(false);
    });

    it('should persist changes to storage', () => {
      TasksComponent.updateTask('1', 'Updated text');
      
      const stored = Storage.get('tasks');
      expect(stored[0].text).toBe('Updated text');
    });

    it('should preserve other task properties', () => {
      const originalCompleted = TasksComponent.tasks[0].completed;
      const originalCreatedAt = TasksComponent.tasks[0].createdAt;
      
      TasksComponent.updateTask('1', 'Updated text');
      
      expect(TasksComponent.tasks[0].completed).toBe(originalCompleted);
      expect(TasksComponent.tasks[0].createdAt).toBe(originalCreatedAt);
    });
  });

  describe('toggleTask', () => {
    beforeEach(() => {
      TasksComponent.listElement = document.getElementById('task-list');
      TasksComponent.tasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', text: 'Task 2', completed: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
    });

    it('should toggle completed from false to true', () => {
      const result = TasksComponent.toggleTask('1');
      
      expect(result).toBe(true);
      expect(TasksComponent.tasks[0].completed).toBe(true);
    });

    it('should toggle completed from true to false', () => {
      const result = TasksComponent.toggleTask('2');
      
      expect(result).toBe(true);
      expect(TasksComponent.tasks[1].completed).toBe(false);
    });

    it('should return false for non-existent task', () => {
      const result = TasksComponent.toggleTask('999');
      
      expect(result).toBe(false);
    });

    it('should persist changes to storage', () => {
      TasksComponent.toggleTask('1');
      
      const stored = Storage.get('tasks');
      expect(stored[0].completed).toBe(true);
    });

    it('should preserve other task properties', () => {
      const originalText = TasksComponent.tasks[0].text;
      const originalCreatedAt = TasksComponent.tasks[0].createdAt;
      
      TasksComponent.toggleTask('1');
      
      expect(TasksComponent.tasks[0].text).toBe(originalText);
      expect(TasksComponent.tasks[0].createdAt).toBe(originalCreatedAt);
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      TasksComponent.listElement = document.getElementById('task-list');
      TasksComponent.tasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', text: 'Task 2', completed: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
    });

    it('should delete task by id', () => {
      const result = TasksComponent.deleteTask('1');
      
      expect(result).toBe(true);
      expect(TasksComponent.tasks.length).toBe(1);
      expect(TasksComponent.tasks[0].id).toBe('2');
    });

    it('should return false for non-existent task', () => {
      const result = TasksComponent.deleteTask('999');
      
      expect(result).toBe(false);
      expect(TasksComponent.tasks.length).toBe(2);
    });

    it('should persist changes to storage', () => {
      TasksComponent.deleteTask('1');
      
      const stored = Storage.get('tasks');
      expect(stored.length).toBe(1);
      expect(stored[0].id).toBe('2');
    });
  });

  describe('render', () => {
    beforeEach(() => {
      TasksComponent.listElement = document.getElementById('task-list');
    });

    it('should render all tasks', () => {
      TasksComponent.tasks = [
        { id: '1', text: 'Task 1', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', text: 'Task 2', completed: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.render();
      
      const taskItems = TasksComponent.listElement.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(2);
    });

    it('should display task text', () => {
      TasksComponent.tasks = [
        { id: '1', text: 'Test Task', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.render();
      
      const taskText = TasksComponent.listElement.querySelector('.task-text');
      expect(taskText.textContent).toBe('Test Task');
    });

    it('should render checkbox with correct checked state', () => {
      TasksComponent.tasks = [
        { id: '1', text: 'Incomplete', completed: false, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: '2', text: 'Complete', completed: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.render();
      
      const checkboxes = TasksComponent.listElement.querySelectorAll('.task-checkbox');
      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(true);
    });

    it('should add completed class to completed tasks', () => {
      TasksComponent.tasks = [
        { id: '1', text: 'Complete', completed: true, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.render();
      
      const taskItem = TasksComponent.listElement.querySelector('.task-item');
      expect(taskItem.classList.contains('completed')).toBe(true);
    });

    it('should render edit and delete buttons', () => {
      TasksComponent.tasks = [
        { id: '1', text: 'Task', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.render();
      
      const editButton = TasksComponent.listElement.querySelector('.btn-icon');
      const deleteButton = TasksComponent.listElement.querySelector('.btn-delete');
      expect(editButton).toBeDefined();
      expect(deleteButton).toBeDefined();
    });

    it('should clear list before rendering', () => {
      TasksComponent.listElement.innerHTML = '<li>Old content</li>';
      TasksComponent.tasks = [
        { id: '1', text: 'New Task', completed: false, createdAt: '2024-01-01T00:00:00.000Z' }
      ];
      
      TasksComponent.render();
      
      const taskItems = TasksComponent.listElement.querySelectorAll('.task-item');
      expect(taskItems.length).toBe(1);
      expect(TasksComponent.listElement.textContent).not.toContain('Old content');
    });
  });
});
