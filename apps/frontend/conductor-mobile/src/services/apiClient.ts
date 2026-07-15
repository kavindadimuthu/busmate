import { API_CONFIG, ServiceType } from '@/config/apiConfig';
import { resolveAccessToken } from '@/lib/auth/tokenStore';

class ApiClient {
  private timeout = 10000;
  private activeRequests = new Map<string, Promise<any>>();

  // The real session (written by AuthContext.login() via tokenStore.saveSession) lives under
  // tokenStore's own namespaced AsyncStorage keys, not a plain 'authToken' key - this used to
  // read a key nothing ever wrote to, silently sending an empty/stale token on every
  // schedule/ticket/notification request. resolveAccessToken() also transparently refreshes a
  // near-expiry token, same as the generated user-management client does.
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await resolveAccessToken();
      return token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private getServiceConfig(serviceType: ServiceType) {
    switch (serviceType) {
      case 'user':
        return API_CONFIG.USER_MANAGEMENT;
      case 'schedule':
        return API_CONFIG.SCHEDULE_MANAGEMENT;
      case 'ticket':
        return API_CONFIG.TICKET_MANAGEMENT;
      default:
        return API_CONFIG.USER_MANAGEMENT;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}, serviceType: ServiceType = 'user'): Promise<T> {
    const serviceConfig = this.getServiceConfig(serviceType);
    let baseURL = String(serviceConfig.baseURL || '');
    const timeout = serviceConfig.timeout;

    // Ensure scheme exists (prepend http:// if missing)
    if (!/^https?:\/\//i.test(baseURL)) {
      baseURL = `http://${baseURL}`;
    }

    // Normalize and build final URL
    const normalizedBase = baseURL.replace(/\/+$/g, '');       // remove trailing slashes
    const normalizedEndpoint = endpoint.replace(/^\/+/g, '');  // remove leading slashes
    const fullUrl = `${normalizedBase}/${normalizedEndpoint}`;

    // Create a unique key for this request to prevent duplicates
    const requestKey = `${serviceType}_${fullUrl}_${JSON.stringify(options)}`;

    // If the same request is already in progress, return the existing promise
    if (this.activeRequests.has(requestKey)) {
      console.log('🔄 Reusing existing request for:', fullUrl, 'on service:', serviceType);
      return this.activeRequests.get(requestKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestPromise = (async (): Promise<T> => {
      try {
        console.log('🚀 Making new API request to:', fullUrl, `(Service: ${serviceType})`);

        const config: RequestInit = {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          signal: controller.signal,
        };

        const response = await fetch(fullUrl, config);
        clearTimeout(timeoutId);

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        console.log(`📋 Response content-type: ${response.headers.get('content-type')}`);

        if (!response.ok) {
          // Try to get error message from response
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          let errorDetails = '';

          try {
            const contentType = response.headers.get('content-type');
            console.log(`📋 Error response content-type: ${contentType}`);

            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
              console.log('📋 JSON error response:', errorData);
            } else {
              // If it's not JSON, get the text content
              const errorText = await response.text();
              console.log('📄 Non-JSON error response:', errorText.substring(0, 500));

              // For 403 errors, provide more specific message
              if (response.status === 403) {
                errorMessage = 'cd ..';
                errorDetails = errorText.substring(0, 200);
              } else {
                errorMessage = `HTTP ${response.status}: Server returned non-JSON response`;
                errorDetails = errorText.substring(0, 200);
              }
            }
          } catch (parseError) {
            console.log('⚠️ Could not parse error response:', parseError);
            if (response.status === 403) {
              errorMessage = 'Permission denied - Invalid credentials or insufficient permissions';
            }
          }

          if (response.status === 401) {
            throw new Error('UNAUTHORIZED');
          }

          const finalError = errorDetails ? `${errorMessage}. Details: ${errorDetails}` : errorMessage;
          throw new Error(finalError);
        }

        // Handle different content types
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.log('✅ Request completed successfully:', fullUrl, `(Service: ${serviceType})`);
          return data;
        } else if (contentType.includes('text/plain')) {
          const text = await response.text();
          console.log('📄 Text response:', text);

          // If it's a success message in plain text, return it
          if (text.toLowerCase().includes('success') || text.toLowerCase().includes('issued')) {
            console.log('✅ Request completed successfully (text response):', fullUrl, `(Service: ${serviceType})`);
            return { success: true, message: text } as T;
          } else {
            throw new Error(`Unexpected text response: ${text}`);
          }
        } else {
          // For any other content type, try to get the response as text for debugging
          const textResponse = await response.text();
          console.log('⚠️ Unexpected content type:', contentType, 'Response:', textResponse.substring(0, 200));

          // If the text contains success indicators, treat it as success
          if (textResponse.toLowerCase().includes('success') ||
            textResponse.toLowerCase().includes('issued') ||
            textResponse.toLowerCase().includes('created')) {
            console.log('✅ Request completed successfully (unknown content type but success message):', fullUrl, `(Service: ${serviceType})`);
            return { success: true, message: textResponse } as T;
          } else {
            throw new Error(`Server returned unexpected content type: ${contentType}. Response: ${textResponse.substring(0, 100)}`);
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.log('❌ Request failed:', fullUrl, `(Service: ${serviceType})`, error);
        throw error;
      } finally {
        // Remove from active requests after completion
        this.activeRequests.delete(requestKey);
      }
    })();

    // Store the request promise
    this.activeRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  async authenticatedRequest<T>(endpoint: string, options: RequestInit = {}, serviceType: ServiceType = 'user'): Promise<T> {
    const serviceConfig = this.getServiceConfig(serviceType);
    let baseURL = String(serviceConfig.baseURL || '');

    // Ensure scheme exists (prepend http:// if missing)
    if (!/^https?:\/\//i.test(baseURL)) {
      baseURL = `http://${baseURL}`;
    }

    // Normalize and build final URL
    const normalizedBase = baseURL.replace(/\/+$/g, '');       // remove trailing slashes
    const normalizedEndpoint = endpoint.replace(/^\/+/g, '');  // remove leading slashes
    const fullUrl = `${normalizedBase}/${normalizedEndpoint}`;

    console.log('🔐 Making authenticated API request to:', fullUrl, `(Service: ${serviceType})`);
    console.log('📋 Request options:', JSON.stringify(options, null, 2));

    const token = await this.getAuthToken();

    if (!token) {
      console.log('❌ No authentication token found');
      throw new Error('No authentication token found');
    }

    console.log('🎫 Token exists, length:', token.length);

    // Log first few characters of token for debugging (safely)
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');

    return this.request<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    }, serviceType);
  }
}

export const apiClient = new ApiClient();
