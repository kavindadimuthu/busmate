/**
 * Gemini AI Service Implementation for Route Generation
 *
 * Implements the IRouteAIService interface for Google's Gemini API.
 * All Gemini API calls are proxied through `/api/ai/generate-route` — a
 * Next.js server-side route — so the API key never appears in the browser
 * Network tab. The frontend only sends prompts; the server holds the key.
 */

import { AIServiceProvider } from './types';
import {
  IRouteAIService,
  AIRouteGenerationRequest,
  AIRouteGenerationResponse,
  RouteGenerationContext,
} from './routeTypes';

// ============================================================================
// INTERNAL PROXY ENDPOINT
// ============================================================================

/** Next.js API route that proxies requests to Gemini server-side. */
const AI_PROXY_ROUTE = '/api/ai/generate-route';
const DEFAULT_MODEL = 'gemini-2.5-flash';

// ============================================================================
// PROMPT TEMPLATES
// ============================================================================

/**
 * Build the system context for route generation
 */
function buildRouteSystemPrompt(context: RouteGenerationContext, outputFormat: 'json' | 'yaml'): string {
  const existingRoutesInfo = context.existingRoutes && context.existingRoutes.length > 0
    ? `\n\nExisting routes in this group:\n${context.existingRoutes.map(r => 
        `- ${r.name} (${r.direction}, ${r.stopsCount} stops, ${r.startStop} → ${r.endStop})`
      ).join('\n')}`
    : '';

  return `You are an expert bus route generator for the BusMate transportation management system in Sri Lanka.

ROUTE GROUP CONTEXT:
- Route Group Name: ${context.routeGroupName || 'Not specified'}
- Route Group Name (Sinhala): ${context.routeGroupNameSinhala || 'Not specified'}
- Route Group Name (Tamil): ${context.routeGroupNameTamil || 'Not specified'}
- Route Group ID: ${context.routeGroupId || 'Not specified (new group)'}
${existingRoutesInfo}

OUTPUT FORMAT: ${outputFormat.toUpperCase()}

IMPORTANT RULES:
1. Generate valid bus routes that make logical sense for Sri Lanka
2. Each route should have OUTBOUND or INBOUND direction
3. Use realistic bus stop names for Sri Lankan locations
4. Include proper Sinhala and Tamil translations for route names and stop names where possible
5. Each route must have at least 2 stops (start and end)
6. Use proper road types: NORMALWAY for regular roads, EXPRESSWAY for highways
7. Include reasonable distance estimates in kilometers
8. Include estimated duration in minutes based on typical bus travel speeds
9. Generate unique IDs for new stops (use format like 'new-stop-1', 'new-stop-2', etc.)
10. Set stop type to 'new' for stops that need to be created
11. Order numbers should start from 0 and be sequential
12. Distance from start should be cumulative (0 for first stop, increasing for each subsequent stop)

${outputFormat === 'json' ? `
OUTPUT JSON STRUCTURE:
{
  "route_group": {
    "name": "Route Group Name",
    "name_sinhala": "Route Group Name in Sinhala",
    "name_tamil": "Route Group Name in Tamil",
    "description": "Description of the route group",
    "routes": [
      {
        "route": {
          "name": "Route Name",
          "name_sinhala": "Route Name in Sinhala",
          "name_tamil": "Route Name in Tamil",
          "route_number": "Route number (e.g., 100, 177)",
          "description": "Route description",
          "direction": "OUTBOUND or INBOUND",
          "road_type": "NORMALWAY or EXPRESSWAY",
          "route_through": "Via locations (e.g., Via Malabe, Kaduwela)",
          "route_through_sinhala": "Via in Sinhala",
          "route_through_tamil": "Via in Tamil",
          "distance_km": 45.5,
          "estimated_duration_minutes": 90,
          "route_stops": [
            {
              "route_stop": {
                "order_number": 0,
                "distance_from_start": 0,
                "stop_type": "S",
                "stop": {
                  "id": "new-stop-1",
                  "name": "Colombo Fort",
                  "name_sinhala": "කොළඹ කොටුව",
                  "name_tamil": "கொழும்பு கோட்டை",
                  "type": "new",
                  "description": "Main bus stand",
                  "is_accessible": true,
                  "location": {
                    "latitude": 6.9340,
                    "longitude": 79.8428,
                    "city": "Colombo",
                    "country": "Sri Lanka"
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}
` : `
OUTPUT YAML STRUCTURE:
route_group:
  name: "Route Group Name"
  name_sinhala: "Route Group Name in Sinhala"
  name_tamil: "Route Group Name in Tamil"
  description: "Description of the route group"
  routes:
    - route:
        name: "Route Name"
        name_sinhala: "Route Name in Sinhala"
        name_tamil: "Route Name in Tamil"
        route_number: "100"
        description: "Route description"
        direction: OUTBOUND
        road_type: NORMALWAY
        route_through: "Via Malabe, Kaduwela"
        route_through_sinhala: "Via in Sinhala"
        route_through_tamil: "Via in Tamil"
        distance_km: 45.5
        estimated_duration_minutes: 90
        route_stops:
          - route_stop:
              order_number: 0
              distance_from_start: 0
              stop_type: S
              stop:
                id: "new-stop-1"
                name: "Colombo Fort"
                name_sinhala: "කොළඹ කොටුව"
                name_tamil: "கொழும்பு கோட்டை"
                type: new
                description: "Main bus stand"
                is_accessible: true
                location:
                  latitude: 6.9340
                  longitude: 79.8428
                  city: "Colombo"
                  country: "Sri Lanka"
`}

STOP TYPES:
- S = Start (first stop)
- E = End (last stop)
- I = Intermediate (stops in between)

RESPOND ONLY WITH THE ${outputFormat.toUpperCase()} DATA - NO ADDITIONAL TEXT, EXPLANATIONS, OR MARKDOWN CODE BLOCKS.`;
}

// ============================================================================
// GEMINI SERVICE IMPLEMENTATION FOR ROUTES
// ============================================================================

export class RouteGeminiAIService implements IRouteAIService {
  readonly provider: AIServiceProvider = 'gemini';
  readonly modelName: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    this.modelName = config?.model || DEFAULT_MODEL;
    this.temperature = config?.temperature ?? 0.7;
    this.maxTokens = config?.maxTokens ?? 8192;
  }

  /**
   * Check if the Gemini service is available.
   *
   * The feature can be disabled at the deployment level by setting
   * NEXT_PUBLIC_GEMINI_ENABLED=false in the frontend environment.
   * When not explicitly disabled, the service is considered available;
   * the server route will return 503 if the server-side key is missing.
   */
  isAvailable(): boolean {
    return process.env.NEXT_PUBLIC_GEMINI_ENABLED !== 'false';
  }

  /**
   * Generate route data by forwarding the request to the server-side proxy.
   *
   * The proxy route at `/api/ai/generate-route` holds the Gemini API key and
   * forwards the prompts to Google's Generative Language API, returning only
   * the generated text back to the browser.
   */
  async generateRouteData(
    request: AIRouteGenerationRequest
  ): Promise<AIRouteGenerationResponse> {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'AI route generation is disabled. Set NEXT_PUBLIC_GEMINI_ENABLED=true to enable it.',
        provider: this.provider,
        model: this.modelName,
      };
    }

    try {
      const systemPrompt = buildRouteSystemPrompt(request.context, request.outputFormat);
      const userPrompt = request.prompt;

      // Call the server-side proxy — Gemini API key never leaves the server.
      const response = await fetch(AI_PROXY_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: this.modelName,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `AI generation error: ${
            (errorData as { error?: string }).error || response.statusText
          }`,
          provider: this.provider,
          model: this.modelName,
        };
      }

      const data = await response.json() as { text?: string; tokensUsed?: number };
      const generatedText = data.text;

      if (!generatedText) {
        return {
          success: false,
          error: 'No content generated by the AI model. The model may have blocked the request.',
          provider: this.provider,
          model: this.modelName,
        };
      }

      // Clean up the response — remove markdown code block markers if present.
      let cleanedData = generatedText.trim();
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

      return {
        success: true,
        data: cleanedData,
        provider: this.provider,
        model: this.modelName,
        tokensUsed: data.tokensUsed,
      };
    } catch (error) {
      console.error('AI proxy error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while calling AI service',
        provider: this.provider,
        model: this.modelName,
      };
    }
  }
}

/**
 * Create a new Route Gemini AI service instance.
 *
 * Note: The `apiKey` parameter is no longer accepted — the key is now managed
 * exclusively on the server side via the `GEMINI_API_KEY` environment variable.
 */
export function createRouteGeminiService(config?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): RouteGeminiAIService {
  return new RouteGeminiAIService(config);
}
