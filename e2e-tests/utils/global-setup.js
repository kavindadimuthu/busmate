/**
 * Global setup file for Playwright tests
 * This runs once before all tests
 */

const { request } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting global setup for API tests...');
  
  // Create a request context to check if the server is ready
  const requestContext = await request.newContext({
    baseURL: 'http://localhost:8080',
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  });

  try {
    // Wait for the server to be ready
    console.log('📡 Checking if Spring Boot server is running...');
    const response = await requestContext.get('/actuator/health', { 
      timeout: 30000 
    });
    
    if (response.ok()) {
      console.log('✅ Spring Boot server is ready!');
    } else {
      throw new Error(`Server health check failed with status: ${response.status()}`);
    }
  } catch (error) {
    console.error('❌ Server is not ready:', error.message);
    console.log('💡 Please ensure your Spring Boot application is running on http://localhost:8080');
    throw error;
  } finally {
    await requestContext.dispose();
  }

  console.log('🎯 Global setup completed successfully!');
}

module.exports = globalSetup;