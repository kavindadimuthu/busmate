/**
 * Authentication configuration for API tests
 * Update the ACCESS_TOKEN when it expires or changes
 */

const AUTH_CONFIG = {
  // JWT Bearer Token - Update this when token expires
  ACCESS_TOKEN: "eyJhbGciOiJIUzI1NiIsImtpZCI6IkFxMFpnckw3Z0dWVklXaUMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2d2eGJ6Y3hqdWVnaHZydHNmZHhjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiIwNThlMzZhOS1iNzFiLTQ4ZWItYmNjMi04MTUxNTdkZjY5YWUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU5MTA2Mjg4LCJpYXQiOjE3NTg3NDYyODgsImVtYWlsIjoia2F2aW5kYWRpbXV0aHUyNjBAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidXNlcl9yb2xlIjoiTW90In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTg3NDYyODh9XSwic2Vzc2lvbl9pZCI6IjFmZGMyOWI0LTk0NzctNDE0ZS04NzUxLWQ0YjVjM2UyZTY1ZSIsImlzX2Fub255bW91cyI6ZmFsc2V9.dajLq9pKfOL_D2UIGaA-aveQlVyj-XigjP-Z2JbWzy8",
  
  // User info extracted from token (for reference)
  USER_EMAIL: "kavindadimuthu260@gmail.com",
  USER_ROLE: "MoT",
  
  // Token expiry (Unix timestamp: 1759106288 = 2025-10-29)
  TOKEN_EXPIRES: new Date(1759106288 * 1000).toISOString(),
  
  // Helper method to get Authorization header
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },
  
  // Helper method to check if token is expired
  isTokenExpired() {
    return Date.now() > (1759106288 * 1000);
  },
  
  // Helper method to get headers without auth (for READ operations)
  getPublicHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
};

module.exports = AUTH_CONFIG;