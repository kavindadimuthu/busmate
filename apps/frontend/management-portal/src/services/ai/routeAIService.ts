/**
 * Route AI Service Factory
 * 
 * Provides a factory function to create AI service instances for route generation
 * and exports all route AI-related types and services.
 */

import { AIServiceProvider, AIServiceConfig, AIServiceOption, AI_SERVICE_OPTIONS } from './types';
import { IRouteAIService, AIRouteGenerationRequest, AIRouteGenerationResponse, RouteGenerationContext } from './routeTypes';
import { RouteGeminiAIService, createRouteGeminiService } from './routeGeminiService';

// ============================================================================
// ROUTE AI SERVICE FACTORY
// ============================================================================

/**
 * Create a route AI service instance based on the provider
 */
export function createRouteAIService(
  provider: AIServiceProvider,
  config?: Partial<AIServiceConfig>
): IRouteAIService {
  switch (provider) {
    case 'gemini':
      return createRouteGeminiService({
        apiKey: config?.apiKey,
        model: config?.model,
        temperature: config?.temperature,
        maxTokens: config?.maxTokens,
      });
    
    case 'openai':
      // Placeholder for future OpenAI implementation
      throw new Error('OpenAI route service is not yet implemented. Please use Gemini.');
    
    case 'claude':
      // Placeholder for future Claude implementation
      throw new Error('Claude route service is not yet implemented. Please use Gemini.');
    
    case 'deepseek':
      // Placeholder for future DeepSeek implementation
      throw new Error('DeepSeek route service is not yet implemented. Please use Gemini.');
    
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get available AI service options for route generation with their availability status
 */
export function getAvailableRouteAIServices(): AIServiceOption[] {
  return AI_SERVICE_OPTIONS.map(option => ({
    ...option,
    isAvailable: isRouteProviderAvailable(option.id),
  }));
}

/**
 * Check if a specific AI provider is available for route generation
 */
export function isRouteProviderAvailable(provider: AIServiceProvider): boolean {
  switch (provider) {
    case 'gemini':
      return !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    case 'openai':
      return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    case 'claude':
      return !!process.env.NEXT_PUBLIC_CLAUDE_API_KEY;
    case 'deepseek':
      return !!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    default:
      return false;
  }
}

/**
 * Get the default AI provider for route generation (first available one)
 */
export function getDefaultRouteProvider(): AIServiceProvider | null {
  const availableProviders: AIServiceProvider[] = ['gemini', 'openai', 'claude', 'deepseek'];
  
  for (const provider of availableProviders) {
    if (isRouteProviderAvailable(provider)) {
      return provider;
    }
  }
  
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export route-specific types
export type {
  IRouteAIService,
  AIRouteGenerationRequest,
  AIRouteGenerationResponse,
  RouteGenerationContext,
} from './routeTypes';

// Export route Gemini service
export { RouteGeminiAIService, createRouteGeminiService } from './routeGeminiService';
