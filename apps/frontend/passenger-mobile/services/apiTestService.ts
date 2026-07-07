import { AuthControllerService } from '@/lib/api-client/user-management/services/AuthControllerService';
import { OpenAPI } from '@/lib/api-client/user-management/core/OpenAPI';

const getLoginUrl = () => `${OpenAPI.BASE}/api/auth/login`;

export class ApiTestService {
  /**
   * Test the API connectivity and authentication endpoint
   * @param email Test email
   * @param password Test password
   * @returns Promise with test result
   */
  static async testLogin(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      console.log('Testing API login with:', { email, url: getLoginUrl() });
      
      const result = await AuthControllerService.login({
        email,
        password,
      });
      
      console.log('API Test Success:', { 
        hasAccessToken: !!result.access_token,
        hasUser: !!result.user,
        userEmail: result.user?.email 
      });
      
      return {
        success: true,
        data: result
      };
      
    } catch (error: any) {
      console.error('API Test Error:', {
        status: error.status,
        message: error.message,
        body: error.body
      });
      
      return {
        success: false,
        error: `API Test Failed: ${error.status || 'Unknown'} - ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Test basic API connectivity
   */
  static async testConnectivity(): Promise<boolean> {
    try {
      // Simple fetch to test if the API is reachable
      const response = await fetch(getLoginUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'invalid'
        })
      });
      
      // We expect this to fail with 401, but it means the API is reachable
      console.log('Connectivity test - API responded with status:', response.status);
      return true;
      
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    }
  }
}
