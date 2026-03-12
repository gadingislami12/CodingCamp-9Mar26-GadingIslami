// ===================================
// Productivity Dashboard Application
// ===================================

// ===================================
// Storage Utility Module
// ===================================
// Provides abstraction over LocalStorage API with error handling
// Methods: get(key), set(key, value), remove(key)

const Storage = {
  // Get data from LocalStorage
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from storage: ${key}`, error);
      return null;
    }
  },
  
  // Save data to LocalStorage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage: ${key}`, error);
      return false;
    }
  },
  
  // Remove data from LocalStorage
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

// ===================================
// Greeting Component Module
// ===================================
// Manages time/date display and time-based greeting messages
// Responsibilities:
// - Display current time in 12-hour format with AM/PM
// - Display current date in human-readable format
// - Show time-based greeting (Good Morning/Afternoon/Evening)
// - Update display every second

const GreetingComponent = {
  // Initialize component
  init() {
    this.timeElement = document.getElementById('current-time');
    this.dateElement = document.getElementById('current-date');
    this.greetingElement = document.getElementById('greeting-message');
    this.updateDisplay();
    // Update every second
    setInterval(() => this.updateDisplay(), 1000);
  },
  
  // Update time, date, and greeting
  updateDisplay() {
    const now = new Date();
    this.updateTime(now);
    this.updateDate(now);
    this.updateGreeting(now);
  },
  
  // Format and display time (12-hour format)
  updateTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    // Pad with zeros
    const formattedTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    this.timeElement.textContent = formattedTime;
  },
  
  // Format and display date
  updateDate(date) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayOfWeek = daysOfWeek[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    const formattedDate = `${dayOfWeek}, ${month} ${day}, ${year}`;
    this.dateElement.textContent = formattedDate;
  },
  
  // Determine and display greeting based on time
  updateGreeting(date) {
    const hour = date.getHours();
    let greeting;
    
    if (hour >= 5 && hour < 12) {
      greeting = "Good Morning";
    } else if (hour >= 12 && hour < 18) {
      greeting = "Good Afternoon";
    } else {
      greeting = "Good Evening";
    }
    
    this.greetingElement.textContent = greeting;
  }
};

// ===================================
// Timer Component Module
// ===================================
// Implements Pomodoro-style countdown timer
// Responsibilities:
// - Initialize with 25-minute default duration
// - Start/stop/reset timer functionality
// - Update display every second during countdown
// - Handle timer completion

const TimerComponent = {
  // State properties
  duration: 25 * 60, // seconds (default 25 minutes)
  remaining: 25 * 60,
  isRunning: false,
  intervalId: null,
  
  // Initialize component
  init() {
    this.displayElement = document.getElementById('timer-display');
    this.startButton = document.getElementById('timer-start');
    this.stopButton = document.getElementById('timer-stop');
    this.resetButton = document.getElementById('timer-reset');
    this.durationInput = document.getElementById('timer-duration-input');
    
    this.loadDuration();
    this.attachEventListeners();
    this.updateDisplay();
  },
  
  // Load custom duration from storage
  loadDuration() {
    const savedDuration = Storage.get('timerDuration');
    if (savedDuration && savedDuration > 0) {
      this.duration = savedDuration * 60; // Convert minutes to seconds
      this.remaining = this.duration;
      this.durationInput.value = savedDuration;
    }
  },
  
  // Save custom duration to storage
  saveDuration(minutes) {
    if (minutes && minutes > 0) {
      Storage.set('timerDuration', minutes);
    }
  },
  
  // Set custom duration (only applies after reset)
  setDuration(minutes) {
    if (minutes && minutes > 0) {
      this.duration = minutes * 60; // Convert minutes to seconds
      this.saveDuration(minutes);
      // Only update remaining time if timer is not running
      if (!this.isRunning) {
        this.remaining = this.duration;
        this.updateDisplay();
      }
    }
  },
  
  // Attach event listeners to buttons
  attachEventListeners() {
    this.startButton.addEventListener('click', () => this.start());
    this.stopButton.addEventListener('click', () => this.stop());
    this.resetButton.addEventListener('click', () => this.reset());
    this.durationInput.addEventListener('change', (e) => {
      const minutes = parseInt(e.target.value, 10);
      this.setDuration(minutes);
    });
  },
  
  // Start countdown
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.displayElement.setAttribute('aria-live', 'polite');
    this.displayElement.classList.add('running');
    this.intervalId = setInterval(() => {
      this.remaining--;
      this.updateDisplay();
      
      if (this.remaining <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  },
  
  // Stop/pause countdown
  stop() {
    this.isRunning = false;
    this.displayElement.setAttribute('aria-live', 'off');
    this.displayElement.classList.remove('running');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },
  
  // Reset to initial duration
  reset() {
    this.stop();
    this.remaining = this.duration;
    this.updateDisplay();
  },
  
  // Update display (format: MM:SS)
  updateDisplay() {
    const minutes = Math.floor(this.remaining / 60);
    const seconds = this.remaining % 60;
    const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
    this.displayElement.textContent = formattedTime;
  },
  
  // Handle timer completion
  onComplete() {
    // Timer has reached zero
    // Visual/audio notification could be added here in the future
  }
};

// ===================================
// Tasks Component Module
// ===================================
// Manages to-do list with CRUD operations and persistence
// Responsibilities:
// - Add new tasks with validation
// - Update task text
// - Toggle task completion status
// - Delete tasks
// - Persist tasks to LocalStorage
// - Load tasks from LocalStorage on initialization
// - Render task list to DOM

const TasksComponent = {
  // State properties
  tasks: [],
  sortEnabled: false,
  
  // Initialize component
  init() {
    this.listElement = document.getElementById('task-list');
    this.inputElement = document.getElementById('task-input');
    this.addButton = document.getElementById('task-add');
    this.sortButton = document.getElementById('task-sort');
    
    this.loadTasks();
    this.attachEventListeners();
    this.render();
  },
  
  // Load tasks from storage
  loadTasks() {
    this.tasks = Storage.get('tasks') || [];
  },
  
  // Save tasks to storage
  saveTasks() {
    Storage.set('tasks', this.tasks);
  },
  
  // Add new task
  addTask(text) {
    if (!text || text.trim() === '') return false;
    
    const task = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.tasks.push(task);
    this.sortEnabled = false; // Reset sorting when task is added
    this.saveTasks();
    this.render();
    return true;
  },
  
  // Update task text
  updateTask(id, newText) {
    const task = this.tasks.find(t => t.id === id);
    if (task && newText.trim() !== '') {
      task.text = newText.trim();
      this.sortEnabled = false; // Reset sorting when task is modified
      this.saveTasks();
      this.render();
      return true;
    }
    return false;
  },
  
  // Toggle task completion status
  toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.sortEnabled = false; // Reset sorting when task is modified
      this.saveTasks();
      this.render();
      return true;
    }
    return false;
  },
  
  // Delete task
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
  
  // Sort tasks (incomplete before completed)
  sortTasks() {
    this.sortEnabled = true;
    this.render();
  },
  
  // Get tasks in display order (sorted if enabled)
  getDisplayTasks() {
    if (this.sortEnabled) {
      // Return sorted copy: incomplete tasks before completed tasks
      return [...this.tasks].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }
    return this.tasks;
  },
  
  // Render task list to DOM
  render() {
    // Clear the list
    this.listElement.innerHTML = '';
    
    // Get tasks in display order (sorted if enabled)
    const displayTasks = this.getDisplayTasks();
    
    // Render each task
    displayTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.setAttribute('role', 'listitem');
      if (task.completed) {
        li.classList.add('completed');
      }
      
      // Checkbox for completion toggle
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'task-checkbox';
      checkbox.id = `task-checkbox-${task.id}`;
      checkbox.setAttribute('aria-label', `Mark task "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
      checkbox.addEventListener('click', () => this.toggleTask(task.id));
      
      // Task text
      const textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;
      textSpan.id = `task-text-${task.id}`;
      if (task.completed) {
        textSpan.classList.add('completed');
      }
      
      // Edit button
      const editButton = document.createElement('button');
      editButton.className = 'btn-icon';
      editButton.textContent = 'Edit';
      editButton.setAttribute('aria-label', `Edit task "${task.text}"`);
      editButton.addEventListener('click', () => {
        const newText = prompt('Edit task:', task.text);
        if (newText !== null) {
          this.updateTask(task.id, newText);
        }
      });
      
      // Delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-icon btn-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.setAttribute('aria-label', `Delete task "${task.text}"`);
      deleteButton.addEventListener('click', () => this.deleteTask(task.id));
      
      // Actions container
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'task-actions';
      actionsDiv.setAttribute('role', 'group');
      actionsDiv.setAttribute('aria-label', 'Task actions');
      actionsDiv.appendChild(editButton);
      actionsDiv.appendChild(deleteButton);
      
      // Assemble the task item
      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(actionsDiv);
      
      this.listElement.appendChild(li);
    });
  },
  
  // Attach event listeners
  attachEventListeners() {
    // Add task on button click
    this.addButton.addEventListener('click', () => {
      const text = this.inputElement.value;
      if (this.addTask(text)) {
        this.inputElement.value = ''; // Clear input on success
      }
    });
    
    // Add task on Enter key
    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const text = this.inputElement.value;
        if (this.addTask(text)) {
          this.inputElement.value = ''; // Clear input on success
        }
      }
    });
    
    // Sort tasks on button click
    this.sortButton.addEventListener('click', () => this.sortTasks());
  }
};

// ===================================
// Links Component Module
// ===================================
// Manages quick links with CRUD operations and persistence
// Responsibilities:
// - Add new links with URL validation
// - Delete links
// - Persist links to LocalStorage
// - Load links from LocalStorage on initialization
// - Render links to DOM with target="_blank"

const LinksComponent = {
  // State properties
  links: [],
  
  // Initialize component
  init() {
    this.containerElement = document.getElementById('links-container');
    this.urlInput = document.getElementById('link-url');
    this.labelInput = document.getElementById('link-label');
    this.addButton = document.getElementById('link-add');
    
    this.loadLinks();
    this.attachEventListeners();
    this.render();
  },
  
  // Load links from storage
  loadLinks() {
    this.links = Storage.get('links') || [];
  },
  
  // Save links to storage
  saveLinks() {
    Storage.set('links', this.links);
  },
  
  // Add new link
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
  
  // Delete link
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
  
  // Validate URL format
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },
  
  // Render links to DOM
  render() {
    // Clear the container
    this.containerElement.innerHTML = '';
    
    // Render each link
    this.links.forEach(link => {
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      linkItem.setAttribute('role', 'listitem');
      
      // Clickable anchor
      const anchor = document.createElement('a');
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.className = 'link-anchor';
      anchor.textContent = link.label;
      anchor.setAttribute('aria-label', `Open ${link.label} in new tab`);
      
      // Delete button
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-danger btn-small link-delete';
      deleteButton.textContent = 'Delete';
      deleteButton.setAttribute('aria-label', `Delete link "${link.label}"`);
      deleteButton.addEventListener('click', () => this.deleteLink(link.id));
      
      // Assemble the link item
      linkItem.appendChild(anchor);
      linkItem.appendChild(deleteButton);
      
      this.containerElement.appendChild(linkItem);
    });
  },
  
  // Attach event listeners
  attachEventListeners() {
    // Add link on button click
    this.addButton.addEventListener('click', () => {
      const url = this.urlInput.value;
      const label = this.labelInput.value;
      if (this.addLink(url, label)) {
        this.urlInput.value = ''; // Clear inputs on success
        this.labelInput.value = '';
      }
    });
    
    // Add link on Enter key in URL input
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const url = this.urlInput.value;
        const label = this.labelInput.value;
        if (this.addLink(url, label)) {
          this.urlInput.value = ''; // Clear inputs on success
          this.labelInput.value = '';
        }
      }
    });
    
    // Add link on Enter key in label input
    this.labelInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const url = this.urlInput.value;
        const label = this.labelInput.value;
        if (this.addLink(url, label)) {
          this.urlInput.value = ''; // Clear inputs on success
          this.labelInput.value = '';
        }
      }
    });
  }
};

// ===================================
// Theme Component Module
// ===================================
// Manages light/dark theme switching and persistence
// Responsibilities:
// - Load saved theme preference from LocalStorage
// - Apply theme to document
// - Toggle between light and dark themes
// - Save theme preference to LocalStorage
// - Update toggle button icon

const ThemeComponent = {
  // State properties
  currentTheme: 'light',
  
  // Initialize component
  init() {
    this.toggleButton = document.getElementById('theme-toggle-btn');
    
    // Load and apply saved theme before other components
    this.loadTheme();
    this.applyTheme();
    this.attachEventListeners();
  },
  
  // Load theme from storage
  loadTheme() {
    const savedTheme = Storage.get('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme;
    } else {
      // Default to light theme
      this.currentTheme = 'light';
    }
  },
  
  // Apply theme to document
  applyTheme() {
    if (this.currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.toggleButton.textContent = '☀️';
      this.toggleButton.setAttribute('aria-pressed', 'true');
      this.toggleButton.setAttribute('aria-label', 'Switch to light theme');
    } else {
      document.documentElement.removeAttribute('data-theme');
      this.toggleButton.textContent = '🌙';
      this.toggleButton.setAttribute('aria-pressed', 'false');
      this.toggleButton.setAttribute('aria-label', 'Switch to dark theme');
    }
  },
  
  // Toggle between light and dark themes
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveTheme();
  },
  
  // Save theme to storage
  saveTheme() {
    Storage.set('theme', this.currentTheme);
  },
  
  // Attach event listeners
  attachEventListeners() {
    this.toggleButton.addEventListener('click', () => this.toggleTheme());
  }
};

// ===================================
// Application Initialization
// ===================================
// Initialize all components when DOM is ready

document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme first to apply before other components load
  ThemeComponent.init();
  GreetingComponent.init();
  TimerComponent.init();
  TasksComponent.init();
  LinksComponent.init();
});
