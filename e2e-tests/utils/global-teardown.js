/**
 * Global teardown file for Playwright tests
 * This runs once after all tests
 */

async function globalTeardown() {
  console.log('🧹 Starting global teardown...');
  
  // Add any cleanup logic here if needed
  // For example:
  // - Clean up test data
  // - Reset database state
  // - Close connections
  
  console.log('✅ Global teardown completed!');
}

module.exports = globalTeardown;