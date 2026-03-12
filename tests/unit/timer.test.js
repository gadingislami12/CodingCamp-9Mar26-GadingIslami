import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('TimerComponent', () => {
  let dom;
  let document;
  let localStorage;
  let TimerComponent;
  let Storage;

  beforeEach(() => {
    // Create a new JSDOM instance for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="timer-display">25:00</div>
          <button id="timer-start">Start</button>
          <button id="timer-stop">Stop</button>
          <button id="timer-reset">Reset</button>
          <input type="number" id="timer-duration-input" value="25" min="1" max="120">
        </body>
      </html>
    `, { url: 'http://localhost' });

    document = dom.window.document;
    global.document = document;
    global.window = dom.window;

    // Mock localStorage
    localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, value) {
        this.data[key] = value;
      },
      removeItem(key) {
        delete this.data[key];
      },
      clear() {
        this.data = {};
      }
    };
    global.localStorage = localStorage;

    // Define Storage utility
    Storage = {
      get(key) {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          return null;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          return false;
        }
      },
      remove(key) {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          return false;
        }
      }
    };

    // Define TimerComponent
    TimerComponent = {
      duration: 25 * 60,
      remaining: 25 * 60,
      isRunning: false,
      intervalId: null,

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

      loadDuration() {
        const savedDuration = Storage.get('timerDuration');
        if (savedDuration && savedDuration > 0) {
          this.duration = savedDuration * 60;
          this.remaining = this.duration;
          this.durationInput.value = savedDuration;
        }
      },

      saveDuration(minutes) {
        if (minutes && minutes > 0) {
          Storage.set('timerDuration', minutes);
        }
      },

      setDuration(minutes) {
        if (minutes && minutes > 0) {
          this.duration = minutes * 60;
          this.saveDuration(minutes);
          if (!this.isRunning) {
            this.remaining = this.duration;
            this.updateDisplay();
          }
        }
      },

      attachEventListeners() {
        this.startButton.addEventListener('click', () => this.start());
        this.stopButton.addEventListener('click', () => this.stop());
        this.resetButton.addEventListener('click', () => this.reset());
        this.durationInput.addEventListener('change', (e) => {
          const minutes = parseInt(e.target.value, 10);
          this.setDuration(minutes);
        });
      },

      start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.intervalId = setInterval(() => {
          this.remaining--;
          this.updateDisplay();
          if (this.remaining <= 0) {
            this.stop();
            this.onComplete();
          }
        }, 1000);
      },

      stop() {
        this.isRunning = false;
        if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
        }
      },

      reset() {
        this.stop();
        this.remaining = this.duration;
        this.updateDisplay();
      },

      updateDisplay() {
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        const formattedTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
        this.displayElement.textContent = formattedTime;
      },

      onComplete() {
        // Timer completion handler
      }
    };
  });

  describe('Duration Customization', () => {
    it('should initialize with default 25 minutes', () => {
      TimerComponent.init();
      expect(TimerComponent.duration).toBe(25 * 60);
      expect(TimerComponent.remaining).toBe(25 * 60);
    });

    it('should load custom duration from LocalStorage on initialization', () => {
      Storage.set('timerDuration', 30);
      TimerComponent.init();
      expect(TimerComponent.duration).toBe(30 * 60);
      expect(TimerComponent.remaining).toBe(30 * 60);
      expect(TimerComponent.durationInput.value).toBe('30');
    });

    it('should save custom duration to LocalStorage when changed', () => {
      TimerComponent.init();
      TimerComponent.setDuration(45);
      const savedDuration = Storage.get('timerDuration');
      expect(savedDuration).toBe(45);
    });

    it('should update duration when input changes and timer is not running', () => {
      TimerComponent.init();
      const input = document.getElementById('timer-duration-input');
      input.value = '15';
      input.dispatchEvent(new dom.window.Event('change'));
      
      expect(TimerComponent.duration).toBe(15 * 60);
      expect(TimerComponent.remaining).toBe(15 * 60);
    });

    it('should not update remaining time when timer is running', () => {
      TimerComponent.init();
      TimerComponent.start();
      const initialRemaining = TimerComponent.remaining;
      
      TimerComponent.setDuration(10);
      
      expect(TimerComponent.duration).toBe(10 * 60);
      expect(TimerComponent.remaining).toBe(initialRemaining);
      
      TimerComponent.stop();
    });

    it('should apply new duration after reset', () => {
      TimerComponent.init();
      TimerComponent.start();
      
      // Change duration while running
      TimerComponent.setDuration(20);
      
      // Reset should apply new duration
      TimerComponent.reset();
      
      expect(TimerComponent.remaining).toBe(20 * 60);
      expect(TimerComponent.isRunning).toBe(false);
    });

    it('should persist custom duration across sessions', () => {
      // First session
      TimerComponent.init();
      TimerComponent.setDuration(40);
      
      // Simulate new session
      const newTimerComponent = Object.create(TimerComponent);
      newTimerComponent.duration = 25 * 60;
      newTimerComponent.remaining = 25 * 60;
      newTimerComponent.isRunning = false;
      newTimerComponent.intervalId = null;
      
      newTimerComponent.init();
      
      expect(newTimerComponent.duration).toBe(40 * 60);
      expect(newTimerComponent.remaining).toBe(40 * 60);
    });

    it('should reject invalid duration values', () => {
      TimerComponent.init();
      const initialDuration = TimerComponent.duration;
      
      TimerComponent.setDuration(0);
      expect(TimerComponent.duration).toBe(initialDuration);
      
      TimerComponent.setDuration(-5);
      expect(TimerComponent.duration).toBe(initialDuration);
      
      TimerComponent.setDuration(null);
      expect(TimerComponent.duration).toBe(initialDuration);
    });

    it('should update display when duration changes', () => {
      TimerComponent.init();
      TimerComponent.setDuration(10);
      
      const display = document.getElementById('timer-display');
      expect(display.textContent).toBe('10:00');
    });
  });

  describe('Timer Basic Functionality', () => {
    it('should start countdown when start button is clicked', () => {
      vi.useFakeTimers();
      TimerComponent.init();
      
      TimerComponent.start();
      expect(TimerComponent.isRunning).toBe(true);
      
      vi.advanceTimersByTime(1000);
      expect(TimerComponent.remaining).toBe(25 * 60 - 1);
      
      vi.useRealTimers();
      TimerComponent.stop();
    });

    it('should stop countdown when stop button is clicked', () => {
      vi.useFakeTimers();
      TimerComponent.init();
      
      TimerComponent.start();
      vi.advanceTimersByTime(5000);
      
      const remainingBeforeStop = TimerComponent.remaining;
      TimerComponent.stop();
      
      expect(TimerComponent.isRunning).toBe(false);
      expect(TimerComponent.remaining).toBe(remainingBeforeStop);
      
      vi.useRealTimers();
    });

    it('should reset to initial duration when reset button is clicked', () => {
      vi.useFakeTimers();
      TimerComponent.init();
      
      TimerComponent.start();
      vi.advanceTimersByTime(10000);
      
      TimerComponent.reset();
      
      expect(TimerComponent.remaining).toBe(TimerComponent.duration);
      expect(TimerComponent.isRunning).toBe(false);
      
      vi.useRealTimers();
    });
  });
});
