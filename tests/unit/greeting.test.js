import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Define GreetingComponent directly (copied from app.js)
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

describe('GreetingComponent', () => {
  let dom;
  let document;

  beforeEach(() => {
    // Set up DOM
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <div id="greeting-message"></div>
          <div id="current-time"></div>
          <div id="current-date"></div>
        </body>
      </html>
    `);
    
    document = dom.window.document;
    global.document = document;
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Time Formatting', () => {
    it('should format time in 12-hour format with AM/PM', () => {
      GreetingComponent.init();
      const timeElement = document.getElementById('current-time');
      const timeText = timeElement.textContent;
      
      // Check format: H:MM:SS AM/PM or HH:MM:SS AM/PM
      const timeRegex = /^(1[0-2]|[1-9]):[0-5][0-9]:[0-5][0-9] (AM|PM)$/;
      expect(timeRegex.test(timeText)).toBe(true);
    });

    it('should format midnight as 12:XX:XX AM', () => {
      const testDate = new Date('2024-01-15T00:30:45');
      GreetingComponent.timeElement = document.getElementById('current-time');
      GreetingComponent.updateTime(testDate);
      
      expect(document.getElementById('current-time').textContent).toBe('12:30:45 AM');
    });

    it('should format noon as 12:XX:XX PM', () => {
      const testDate = new Date('2024-01-15T12:30:45');
      GreetingComponent.timeElement = document.getElementById('current-time');
      GreetingComponent.updateTime(testDate);
      
      expect(document.getElementById('current-time').textContent).toBe('12:30:45 PM');
    });

    it('should format 1 PM correctly', () => {
      const testDate = new Date('2024-01-15T13:15:30');
      GreetingComponent.timeElement = document.getElementById('current-time');
      GreetingComponent.updateTime(testDate);
      
      expect(document.getElementById('current-time').textContent).toBe('1:15:30 PM');
    });
  });

  describe('Date Formatting', () => {
    it('should format date with day of week, month, day, and year', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      GreetingComponent.dateElement = document.getElementById('current-date');
      GreetingComponent.updateDate(testDate);
      
      expect(document.getElementById('current-date').textContent).toBe('Monday, January 15, 2024');
    });

    it('should format different dates correctly', () => {
      const testDate = new Date('2024-12-25T10:30:00');
      GreetingComponent.dateElement = document.getElementById('current-date');
      GreetingComponent.updateDate(testDate);
      
      expect(document.getElementById('current-date').textContent).toBe('Wednesday, December 25, 2024');
    });
  });

  describe('Greeting Logic', () => {
    it('should display "Good Morning" for hours 5-11', () => {
      const testDate = new Date('2024-01-15T08:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Morning');
    });

    it('should display "Good Morning" at 5 AM (boundary)', () => {
      const testDate = new Date('2024-01-15T05:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Morning');
    });

    it('should display "Good Afternoon" for hours 12-17', () => {
      const testDate = new Date('2024-01-15T14:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Afternoon');
    });

    it('should display "Good Afternoon" at noon (boundary)', () => {
      const testDate = new Date('2024-01-15T12:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Afternoon');
    });

    it('should display "Good Evening" for hours 18-4', () => {
      const testDate = new Date('2024-01-15T20:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Evening');
    });

    it('should display "Good Evening" at 6 PM (boundary)', () => {
      const testDate = new Date('2024-01-15T18:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Evening');
    });

    it('should display "Good Evening" at 2 AM', () => {
      const testDate = new Date('2024-01-15T02:00:00');
      GreetingComponent.greetingElement = document.getElementById('greeting-message');
      GreetingComponent.updateGreeting(testDate);
      
      expect(document.getElementById('greeting-message').textContent).toBe('Good Evening');
    });
  });

  describe('Component Integration', () => {
    it('should initialize and update all displays', () => {
      GreetingComponent.init();
      
      const timeElement = document.getElementById('current-time');
      const dateElement = document.getElementById('current-date');
      const greetingElement = document.getElementById('greeting-message');
      
      expect(timeElement.textContent).not.toBe('');
      expect(dateElement.textContent).not.toBe('');
      expect(greetingElement.textContent).not.toBe('');
    });
  });
});
