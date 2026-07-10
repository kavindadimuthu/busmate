/**
 * Route AI Service Types
 * 
 * Provides types specific to route data generation using AI services.
 * Extends the base AI service architecture for route-specific functionality.
 */

import { AIServiceProvider } from './types';

// ============================================================================
// ROUTE GENERATION CONTEXT
// ============================================================================

/**
 * Context information for AI route generation
 */
export interface RouteGenerationContext {
  routeGroupId?: string;
  routeGroupName: string | null;
  routeGroupNameSinhala?: string | null;
  routeGroupNameTamil?: string | null;
  existingRoutes?: Array<{
    name: string;
    direction: string;
    stopsCount: number;
    startStop?: string;
    endStop?: string;
  }>;
}

/**
 * Request for AI route generation
 */
export interface AIRouteGenerationRequest {
  prompt: string;
  context: RouteGenerationContext;
  outputFormat: 'json' | 'yaml';
}

/**
 * Response from AI route generation
 */
export interface AIRouteGenerationResponse {
  success: boolean;
  data?: string; // Generated route data in JSON or YAML format
  error?: string;
  provider: AIServiceProvider;
  model: string;
  tokensUsed?: number;
}

// ============================================================================
// ROUTE AI SERVICE INTERFACE
// ============================================================================

/**
 * Interface that AI services must implement for route generation
 */
export interface IRouteAIService {
  readonly provider: AIServiceProvider;
  readonly modelName: string;
  
  /**
   * Check if the service is properly configured and available
   */
  isAvailable(): boolean;
  
  /**
   * Generate route data based on user prompt and context
   */
  generateRouteData(
    request: AIRouteGenerationRequest
  ): Promise<AIRouteGenerationResponse>;
}
