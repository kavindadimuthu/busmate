/**
 * AI Service Types and Interfaces
 * 
 * Provides a pluggable architecture for integrating different AI services
 * (Gemini, OpenAI, Claude, Deepseek, etc.) for schedule data generation.
 */

// ============================================================================
// AI SERVICE CONFIGURATION
// ============================================================================

/**
 * Supported AI service providers
 */
export type AIServiceProvider = 'gemini' | 'openai' | 'claude' | 'deepseek';

/**
 * Configuration for an AI service
 */
export interface AIServiceConfig {
  provider: AIServiceProvider;
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Available AI service options for the UI
 */
export interface AIServiceOption {
  id: AIServiceProvider;
  name: string;
  description: string;
  isAvailable: boolean;
  envKeyName: string;
}

// ============================================================================
// AI GENERATION TYPES
// ============================================================================

/**
 * Context information for AI generation
 */
export interface ScheduleGenerationContext {
  routeId: string | null;
  routeName: string | null;
  routeGroupName: string | null;
  routeStops: Array<{
    id: string;
    name: string;
    stopOrder: number;
  }>;
  existingSchedules?: Array<{
    name: string;
    scheduleType: string;
    startTime: string;
  }>;
}

/**
 * Request for AI schedule generation
 */
export interface AIScheduleGenerationRequest {
  prompt: string;
  context: ScheduleGenerationContext;
  outputFormat: 'json' | 'yaml';
}

/**
 * Response from AI schedule generation
 */
export interface AIScheduleGenerationResponse {
  success: boolean;
  data?: string; // Generated schedule data in JSON or YAML format
  error?: string;
  provider: AIServiceProvider;
  model: string;
  tokensUsed?: number;
}

// ============================================================================
// AI SERVICE INTERFACE
// ============================================================================

/**
 * Interface that all AI services must implement
 */
export interface IAIService {
  readonly provider: AIServiceProvider;
  readonly modelName: string;
  
  /**
   * Check if the service is properly configured and available
   */
  isAvailable(): boolean;
  
  /**
   * Generate schedule data based on user prompt and context
   */
  generateScheduleData(
    request: AIScheduleGenerationRequest
  ): Promise<AIScheduleGenerationResponse>;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default AI service options configuration
 */
export const AI_SERVICE_OPTIONS: AIServiceOption[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google\'s Gemini Pro model for schedule generation',
    isAvailable: true,
    envKeyName: 'NEXT_PUBLIC_GEMINI_API_KEY',
  },
  {
    id: 'openai',
    name: 'OpenAI GPT',
    description: 'OpenAI GPT-4 for advanced schedule generation',
    isAvailable: false,
    envKeyName: 'NEXT_PUBLIC_OPENAI_API_KEY',
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    description: 'Claude AI for detailed schedule analysis',
    isAvailable: false,
    envKeyName: 'NEXT_PUBLIC_CLAUDE_API_KEY',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek AI for efficient schedule generation',
    isAvailable: false,
    envKeyName: 'NEXT_PUBLIC_DEEPSEEK_API_KEY',
  },
];

/**
 * Get the environment variable key name for an AI provider
 */
export function getEnvKeyForProvider(provider: AIServiceProvider): string {
  const option = AI_SERVICE_OPTIONS.find(opt => opt.id === provider);
  return option?.envKeyName || '';
}

/**
 * Check if an API key is configured for a provider
 */
export function isProviderConfigured(provider: AIServiceProvider): boolean {
  const envKey = getEnvKeyForProvider(provider);
  if (!envKey) return false;
  
  const apiKey = process.env[envKey];
  return !!apiKey && apiKey.trim().length > 0;
}
