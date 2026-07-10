/**
 * AI Service Factory and Index
 * 
 * Provides a factory function to create AI service instances
 * and exports all AI-related types and services.
 */

import {
  IAIService,
  AIServiceProvider,
  AIServiceConfig,
  AIServiceOption,
  AI_SERVICE_OPTIONS,
} from './types';
import { GeminiAIService, createGeminiService } from './geminiService';

// ============================================================================
// AI SERVICE FACTORY
// ============================================================================

/**
 * Create an AI service instance based on the provider
 */
export function createAIService(
  provider: AIServiceProvider,
  config?: Partial<AIServiceConfig>
): IAIService {
  switch (provider) {
    case 'gemini':
      return createGeminiService({
        apiKey: config?.apiKey,
        model: config?.model,
        temperature: config?.temperature,
        maxTokens: config?.maxTokens,
      });
    
    case 'openai':
      // Placeholder for future OpenAI implementation
      throw new Error('OpenAI service is not yet implemented. Please use Gemini.');
    
    case 'claude':
      // Placeholder for future Claude implementation
      throw new Error('Claude service is not yet implemented. Please use Gemini.');
    
    case 'deepseek':
      // Placeholder for future DeepSeek implementation
      throw new Error('DeepSeek service is not yet implemented. Please use Gemini.');
    
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Get available AI service options with their availability status
 */
export function getAvailableAIServices(): AIServiceOption[] {
  return AI_SERVICE_OPTIONS.map(option => ({
    ...option,
    isAvailable: isProviderAvailable(option.id),
  }));
}

/**
 * Check if a specific AI provider is available (has API key configured)
 */
export function isProviderAvailable(provider: AIServiceProvider): boolean {
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
 * Get the default AI provider (first available one)
 */
export function getDefaultProvider(): AIServiceProvider | null {
  const availableProviders: AIServiceProvider[] = ['gemini', 'openai', 'claude', 'deepseek'];
  
  for (const provider of availableProviders) {
    if (isProviderAvailable(provider)) {
      return provider;
    }
  }
  
  return null;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Re-export types
export type {
  IAIService,
  AIServiceProvider,
  AIServiceConfig,
  AIServiceOption,
  AIScheduleGenerationRequest,
  AIScheduleGenerationResponse,
  ScheduleGenerationContext,
} from './types';

export { AI_SERVICE_OPTIONS, getEnvKeyForProvider, isProviderConfigured } from './types';

// Export Gemini service
export { GeminiAIService, createGeminiService } from './geminiService';

// ============================================================================
// ROUTE AI SERVICE EXPORTS
// ============================================================================

// Export route-specific types
export type {
  IRouteAIService,
  AIRouteGenerationRequest,
  AIRouteGenerationResponse,
  RouteGenerationContext,
} from './routeTypes';

// Export route AI service factory and utilities
export {
  createRouteAIService,
  getAvailableRouteAIServices,
  isRouteProviderAvailable,
  getDefaultRouteProvider,
} from './routeAIService';

// Export route Gemini service
export { RouteGeminiAIService, createRouteGeminiService } from './routeGeminiService';
