/**
 * Test helper utilities for API testing
 */

const AUTH_CONFIG = require('../config/auth.config');

/**
 * Create a test stop object with default values
 * @param {Object} overrides - Properties to override
 * @returns {Object} Stop request object
 */
function createTestStop(overrides = {}) {
  return {
    name: 'Test Bus Stop',
    description: 'A test bus stop for automated testing',
    location: {
      latitude: 6.9271,
      longitude: 79.8612,
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test Province',
      zipCode: '12345',
      country: 'Sri Lanka'
    },
    isAccessible: true,
    ...overrides
  };
}

/**
 * Get authenticated headers with JWT Bearer token
 * @returns {Object} Headers object with Bearer token
 */
function getAuthHeaders() {
  return AUTH_CONFIG.getAuthHeaders();
}

/**
 * Get public headers (no authentication)
 * @returns {Object} Headers object without authentication
 */
function getPublicHeaders() {
  return AUTH_CONFIG.getPublicHeaders();
}

/**
 * Validate stop response structure
 * @param {Object} stop - Stop object to validate
 * @returns {boolean} True if valid
 */
function validateStopStructure(stop) {
  const requiredFields = [
    'id', 'name', 'latitude', 'longitude', 
    'city', 'state', 'country', 'isAccessible',
    'createdAt', 'updatedAt'
  ];
  
  return requiredFields.every(field => stop.hasOwnProperty(field));
}

/**
 * Wait for a specific condition with timeout
 * @param {Function} condition - Function that returns true when condition is met
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<boolean>} True if condition met, false if timeout
 */
async function waitForCondition(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  createTestStop,
  getAuthHeaders,
  getPublicHeaders,
  validateStopStructure,
  waitForCondition,
  generateRandomString
};