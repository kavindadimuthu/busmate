/**
 * Gemini AI Service Implementation
 * 
 * Implements the IAIService interface for Google's Gemini API
 * to generate schedule data based on user prompts.
 */

import {
  IAIService,
  AIServiceProvider,
  AIScheduleGenerationRequest,
  AIScheduleGenerationResponse,
  ScheduleGenerationContext,
} from './types';

// ============================================================================
// GEMINI API CONFIGURATION
// ============================================================================

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
// const DEFAULT_MODEL = 'gemini-1.5-flash';
const DEFAULT_MODEL = 'gemini-2.5-flash';

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Build the system context for schedule generation
 */
function buildSystemPrompt(context: ScheduleGenerationContext, outputFormat: 'json' | 'yaml'): string {
  const stopsList = context.routeStops
    .map(stop => `  ${stop.stopOrder}. ${stop.name} (ID: ${stop.id})`)
    .join('\n');

  const existingSchedulesInfo = context.existingSchedules && context.existingSchedules.length > 0
    ? `\n\nExisting schedules for this route:\n${context.existingSchedules.map(s => 
        `- ${s.name} (${s.scheduleType}, starts at ${s.startTime})`
      ).join('\n')}`
    : '';

  return `You are an expert bus schedule generator for the BusMate transportation management system.

ROUTE CONTEXT:
- Route: ${context.routeName || 'Not specified'}
- Route Group: ${context.routeGroupName || 'Not specified'}
- Route ID: ${context.routeId || 'Not specified'}

ROUTE STOPS (in order):
${stopsList || 'No stops defined'}
${existingSchedulesInfo}

OUTPUT FORMAT: ${outputFormat.toUpperCase()}

IMPORTANT RULES:
1. Generate valid bus schedules that make logical sense for the route
2. Use realistic time intervals between stops (typically 2-15 minutes depending on distance)
3. First stop departure time should be specified, subsequent stops should have both arrival and departure times
4. Use 24-hour time format (HH:mm)
5. Use the exact stop IDs provided in the route stops list
6. The stop_order should match the order provided (0-indexed)
7. Calendar should specify which days the schedule operates
8. Use proper schedule types: REGULAR for normal service, SPECIAL for holiday/event service
9. Status should typically be PENDING for new schedules

${outputFormat === 'json' ? `
OUTPUT JSON STRUCTURE:
{
  "schedules": [
    {
      "name": "Schedule Name",
      "schedule_type": "REGULAR",
      "status": "PENDING",
      "description": "Description",
      "effective_start_date": "YYYY-MM-DD",
      "effective_end_date": "YYYY-MM-DD or empty",
      "generate_trips": true,
      "calendar": {
        "monday": true,
        "tuesday": true,
        "wednesday": true,
        "thursday": true,
        "friday": true,
        "saturday": false,
        "sunday": false
      },
      "stops": [
        {
          "stop_id": "stop-uuid",
          "stop_order": 0,
          "arrival_time": "06:00",
          "departure_time": "06:02"
        }
      ],
      "exceptions": [
        {
          "exception_date": "YYYY-MM-DD",
          "exception_type": "REMOVED",
          "description": "Holiday"
        }
      ]
    }
  ]
}
` : `
OUTPUT YAML STRUCTURE:
schedules:
  - schedule:
      name: "Schedule Name"
      schedule_type: REGULAR
      status: PENDING
      description: "Description"
      effective_start_date: "YYYY-MM-DD"
      effective_end_date: ""
      generate_trips: true
      calendar:
        monday: true
        tuesday: true
        wednesday: true
        thursday: true
        friday: true
        saturday: false
        sunday: false
      stops:
        - stop:
            stop_id: "stop-uuid"
            stop_order: 0
            arrival_time: "06:00"
            departure_time: "06:02"
      exceptions:
        - exception:
            exception_date: "YYYY-MM-DD"
            exception_type: REMOVED
            description: "Holiday"
`}

RESPOND ONLY WITH THE ${outputFormat.toUpperCase()} DATA - NO ADDITIONAL TEXT, EXPLANATIONS, OR MARKDOWN CODE BLOCKS.`;
}

// ============================================================================
// GEMINI SERVICE IMPLEMENTATION
// ============================================================================

export class GeminiAIService implements IAIService {
  readonly provider: AIServiceProvider = 'gemini';
  readonly modelName: string;
  private apiKey: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config?: {
    apiKey?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    this.apiKey = config?.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    this.modelName = config?.model || DEFAULT_MODEL;
    this.temperature = config?.temperature ?? 0.7;
    this.maxTokens = config?.maxTokens ?? 8192;
  }

  /**
   * Check if the Gemini service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * Generate schedule data using Gemini API
   */
  async generateScheduleData(
    request: AIScheduleGenerationRequest
  ): Promise<AIScheduleGenerationResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables.',
        provider: this.provider,
        model: this.modelName,
      };
    }

    try {
      const systemPrompt = buildSystemPrompt(request.context, request.outputFormat);
      const userPrompt = request.prompt;

      const response = await fetch(
        `${GEMINI_API_URL}/${this.modelName}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: `\n\nUSER REQUEST: ${userPrompt}` },
                ],
              },
            ],
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: this.maxTokens,
              topP: 0.95,
              topK: 64,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_ONLY_HIGH',
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_ONLY_HIGH',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_ONLY_HIGH',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Gemini API error: ${errorData.error?.message || response.statusText}`,
          provider: this.provider,
          model: this.modelName,
        };
      }

      const data = await response.json();
      
      // Extract the generated text from Gemini response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        return {
          success: false,
          error: 'No content generated by Gemini. The model may have blocked the request.',
          provider: this.provider,
          model: this.modelName,
        };
      }

      // Clean up the response - remove markdown code blocks if present
      let cleanedData = generatedText.trim();
      
      // Remove markdown code block markers
      if (cleanedData.startsWith('```json')) {
        cleanedData = cleanedData.slice(7);
      } else if (cleanedData.startsWith('```yaml')) {
        cleanedData = cleanedData.slice(7);
      } else if (cleanedData.startsWith('```')) {
        cleanedData = cleanedData.slice(3);
      }
      
      if (cleanedData.endsWith('```')) {
        cleanedData = cleanedData.slice(0, -3);
      }
      
      cleanedData = cleanedData.trim();

      // Calculate tokens used (approximate for Gemini)
      const tokensUsed = data.usageMetadata?.totalTokenCount || undefined;

      return {
        success: true,
        data: cleanedData,
        provider: this.provider,
        model: this.modelName,
        tokensUsed,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while calling Gemini API',
        provider: this.provider,
        model: this.modelName,
      };
    }
  }
}

/**
 * Create a new Gemini AI service instance
 */
export function createGeminiService(config?: {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): GeminiAIService {
  return new GeminiAIService(config);
}
