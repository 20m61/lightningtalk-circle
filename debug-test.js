// Quick debug test to check getComputedStyle behavior
import { jest } from '@jest/globals';

// Mock setup similar to jest.setup.cjs
const mockComputedStyle = {
  getPropertyValue: jest.fn(prop => {
    console.log('getPropertyValue called with:', prop);
    const mockValues = {
      'background-color': '#22c55e',
      'min-height': '44px',
      '--color-primary-500': '#22c55e',
      '--spacing-md': '16px',
      '--font-size-lg': '1.125rem',
      display: 'block',
      position: 'relative',
      opacity: '1',
      transform: 'none'
    };
    return mockValues[prop] || '';
  }),
  backgroundColor: '#22c55e',
  minHeight: '44px',
  display: 'block',
  position: 'relative',
  opacity: '1',
  transform: 'none'
};

global.getComputedStyle = jest.fn(() => {
  console.log('getComputedStyle called');
  return mockComputedStyle;
});

// Test DOM setup
const button = document.createElement('button');
button.className = 'btn btn-primary';
document.body.appendChild(button);

console.log('Testing getComputedStyle...');
const computedStyle = getComputedStyle(button);
console.log('computedStyle:', computedStyle);
console.log('computedStyle type:', typeof computedStyle);

if (computedStyle) {
  console.log('getPropertyValue method:', typeof computedStyle.getPropertyValue);
  const bgColor = computedStyle.getPropertyValue('background-color');
  console.log('background-color:', bgColor);
} else {
  console.log('computedStyle is null/undefined');
}

export {};
