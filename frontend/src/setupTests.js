// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.getComputedStyle
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = jest.fn().mockImplementation((element) => {
  const style = originalGetComputedStyle(element);
  
  // Add responsive-specific style mocks
  return {
    ...style,
    display: element.classList.contains('hidden') ? 'none' : 'block',
    gridTemplateColumns: element.classList.contains('grid-cols-1') ? '1fr' : 
                        element.classList.contains('grid-cols-2') ? '1fr 1fr' :
                        element.classList.contains('grid-cols-3') ? '1fr 1fr 1fr' : 'none',
    transform: element.classList.contains('-translate-x-full') ? 'translateX(-100%)' :
               element.classList.contains('translate-x-0') ? 'translateX(0px)' : 'none',
    visibility: element.classList.contains('invisible') ? 'hidden' : 'visible',
    opacity: element.classList.contains('opacity-0') ? '0' : '1',
  };
});

// Mock getBoundingClientRect for touch target testing
Element.prototype.getBoundingClientRect = jest.fn().mockImplementation(function() {
  const element = this;
  
  // Default size
  let width = 100;
  let height = 40;
  
  // Check for button-specific classes that indicate larger touch targets
  if (element.classList.contains('h-11') || element.classList.contains('py-3')) {
    height = 44; // Minimum touch target
  }
  
  if (element.classList.contains('h-12') || element.classList.contains('py-4')) {
    height = 48;
  }
  
  if (element.classList.contains('w-full')) {
    width = 300; // Simulate full width
  }
  
  if (element.classList.contains('w-44')) {
    width = 176; // w-44 = 11rem = 176px
  }
  
  return {
    width,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: width,
    x: 0,
    y: 0,
    toJSON: () => ({ width, height, top: 0, left: 0, bottom: height, right: width })
  };
});

// Mock CSS transitions for testing
// Skip transition mocking to avoid compatibility issues with jsdom

// Mock viewport dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

// Mock touch events
if (!window.TouchEvent) {
  window.TouchEvent = class TouchEvent extends Event {
    constructor(type, options = {}) {
      super(type, options);
      this.touches = options.touches || [];
      this.targetTouches = options.targetTouches || [];
      this.changedTouches = options.changedTouches || [];
    }
  };
}

// Mock performance.now for performance testing
if (!window.performance) {
  window.performance = {
    now: jest.fn(() => Date.now())
  };
}

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected during testing
  if (
    args[0]?.includes?.('React Router') ||
    args[0]?.includes?.('Warning: ReactDOM.render') ||
    args[0]?.includes?.('Warning: componentWillReceiveProps')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Clean up after each test
afterEach(() => {
  // Reset viewport to default
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 768,
  });
  
  // Clear any mocks
  jest.clearAllMocks();
});