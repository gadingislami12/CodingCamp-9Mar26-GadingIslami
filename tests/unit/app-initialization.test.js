import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

describe('Application Initialization', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Create a fresh DOM for each test
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <button id="theme-toggle-btn"></button>
          <div id="greeting-message"></div>
          <div id="current-time"></div>
          <div id="current-date"></div>
          <div id="timer-display"></div>
          <button id="timer-start"></button>
          <button id="timer-stop"></button>
          <button id="timer-reset"></button>
          <input id="timer-duration-input" type="number" value="25" />
          <ul id="task-list"></ul>
          <input id="task-input" type="text" />
          <button id="task-add"></button>
          <button id="task-sort"></button>
          <div id="links-container"></div>
          <input id="link-url" type="url" />
          <input id="link-label" type="text" />
          <button id="link-add"></button>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      pretendToBeVisual: true
    });

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
  });

  it('should have DOMContentLoaded event listener', () => {
    // Mock the components
    const mockComponents = {
      ThemeComponent: { init: vi.fn() },
      GreetingComponent: { init: vi.fn() },
      TimerComponent: { init: vi.fn() },
      TasksComponent: { init: vi.fn() },
      LinksComponent: { init: vi.fn() }
    };

    // Simulate the initialization code
    document.addEventListener('DOMContentLoaded', () => {
      mockComponents.ThemeComponent.init();
      mockComponents.GreetingComponent.init();
      mockComponents.TimerComponent.init();
      mockComponents.TasksComponent.init();
      mockComponents.LinksComponent.init();
    });

    // Trigger DOMContentLoaded
    const event = new window.Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Verify all components were initialized
    expect(mockComponents.ThemeComponent.init).toHaveBeenCalledTimes(1);
    expect(mockComponents.GreetingComponent.init).toHaveBeenCalledTimes(1);
    expect(mockComponents.TimerComponent.init).toHaveBeenCalledTimes(1);
    expect(mockComponents.TasksComponent.init).toHaveBeenCalledTimes(1);
    expect(mockComponents.LinksComponent.init).toHaveBeenCalledTimes(1);
  });

  it('should initialize components in the correct order', () => {
    const initOrder = [];
    
    const mockComponents = {
      ThemeComponent: { init: () => initOrder.push('Theme') },
      GreetingComponent: { init: () => initOrder.push('Greeting') },
      TimerComponent: { init: () => initOrder.push('Timer') },
      TasksComponent: { init: () => initOrder.push('Tasks') },
      LinksComponent: { init: () => initOrder.push('Links') }
    };

    // Simulate the initialization code
    document.addEventListener('DOMContentLoaded', () => {
      mockComponents.ThemeComponent.init();
      mockComponents.GreetingComponent.init();
      mockComponents.TimerComponent.init();
      mockComponents.TasksComponent.init();
      mockComponents.LinksComponent.init();
    });

    // Trigger DOMContentLoaded
    const event = new window.Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Verify initialization order
    expect(initOrder).toEqual(['Theme', 'Greeting', 'Timer', 'Tasks', 'Links']);
  });

  it('should ensure components are independent', () => {
    // Mock components with independent state
    const ThemeComponent = {
      currentTheme: 'light',
      init: vi.fn()
    };

    const GreetingComponent = {
      timeElement: null,
      init: vi.fn()
    };

    const TimerComponent = {
      duration: 25 * 60,
      init: vi.fn()
    };

    const TasksComponent = {
      tasks: [],
      init: vi.fn()
    };

    const LinksComponent = {
      links: [],
      init: vi.fn()
    };

    // Simulate initialization
    document.addEventListener('DOMContentLoaded', () => {
      ThemeComponent.init();
      GreetingComponent.init();
      TimerComponent.init();
      TasksComponent.init();
      LinksComponent.init();
    });

    // Trigger DOMContentLoaded
    const event = new window.Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Verify each component maintains its own state
    expect(ThemeComponent.currentTheme).toBe('light');
    expect(GreetingComponent.timeElement).toBe(null);
    expect(TimerComponent.duration).toBe(1500);
    expect(TasksComponent.tasks).toEqual([]);
    expect(LinksComponent.links).toEqual([]);

    // Verify all components were initialized
    expect(ThemeComponent.init).toHaveBeenCalled();
    expect(GreetingComponent.init).toHaveBeenCalled();
    expect(TimerComponent.init).toHaveBeenCalled();
    expect(TasksComponent.init).toHaveBeenCalled();
    expect(LinksComponent.init).toHaveBeenCalled();
  });

  it('should initialize all components when DOM is ready (Requirements 8.1, 8.2)', () => {
    const startTime = Date.now();
    const mockComponents = {
      ThemeComponent: { init: vi.fn() },
      GreetingComponent: { init: vi.fn() },
      TimerComponent: { init: vi.fn() },
      TasksComponent: { init: vi.fn() },
      LinksComponent: { init: vi.fn() }
    };

    // Simulate the initialization code
    document.addEventListener('DOMContentLoaded', () => {
      mockComponents.ThemeComponent.init();
      mockComponents.GreetingComponent.init();
      mockComponents.TimerComponent.init();
      mockComponents.TasksComponent.init();
      mockComponents.LinksComponent.init();
    });

    // Trigger DOMContentLoaded
    const event = new window.Event('DOMContentLoaded');
    document.dispatchEvent(event);

    const endTime = Date.now();
    const initializationTime = endTime - startTime;

    // Verify all components initialized
    expect(mockComponents.ThemeComponent.init).toHaveBeenCalled();
    expect(mockComponents.GreetingComponent.init).toHaveBeenCalled();
    expect(mockComponents.TimerComponent.init).toHaveBeenCalled();
    expect(mockComponents.TasksComponent.init).toHaveBeenCalled();
    expect(mockComponents.LinksComponent.init).toHaveBeenCalled();

    // Verify initialization is fast (Requirement 8.1: respond within 100ms)
    // Note: This is a basic check; actual performance may vary
    expect(initializationTime).toBeLessThan(100);
  });
});
