'use client';

import { useState, useCallback, useMemo } from 'react';
import { useScheduleWorkspace } from '@/context/ScheduleWorkspace/useScheduleWorkspace';
import { useToast } from '@/hooks/use-toast';
import {
  createAIService,
  getAvailableAIServices,
  getDefaultProvider,
  AIServiceProvider,
  AIScheduleGenerationResponse,
} from '@/services/ai';
import { Loader2, Sparkles, Copy, Check, ArrowRight, RefreshCw, Settings, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type OutputFormat = 'json' | 'yaml';

interface GenerationState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  lastResponse: AIScheduleGenerationResponse | null;
}

// ============================================================================
// EXAMPLE PROMPTS
// ============================================================================

const EXAMPLE_PROMPTS = [
  'Generate a weekday morning schedule starting at 6:00 AM with 10-minute intervals between stops',
  'Create 3 schedules: morning (6 AM), afternoon (2 PM), and evening (6 PM) rush hour services',
  'Generate a weekend-only schedule with fewer trips, starting at 8:00 AM',
  'Create a special holiday schedule for Christmas week with reduced service',
  'Generate a complete daily schedule set with trips every 30 minutes from 5 AM to 11 PM',
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScheduleAIStudio() {
  const { data, updateFromYaml, updateFromJson } = useScheduleWorkspace();
  const { toast } = useToast();

  // State
  const [prompt, setPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('json');
  const [selectedProvider, setSelectedProvider] = useState<AIServiceProvider>(() =>
    getDefaultProvider() || 'gemini'
  );
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generation, setGeneration] = useState<GenerationState>({
    isLoading: false,
    result: null,
    error: null,
    lastResponse: null,
  });

  // Get available AI services
  const availableServices = useMemo(() => getAvailableAIServices(), []);
  const currentService = useMemo(
    () => availableServices.find(s => s.id === selectedProvider),
    [availableServices, selectedProvider]
  );

  // Build context for AI generation
  const buildContext = useCallback(() => {
    return {
      routeId: data.selectedRouteId,
      routeName: data.selectedRouteName,
      routeGroupName: data.selectedRouteGroupName,
      routeStops: data.routeStops.map(stop => ({
        id: stop.id,
        name: stop.name,
        stopOrder: stop.stopOrder,
      })),
      existingSchedules: data.schedules.map(schedule => ({
        name: schedule.name,
        scheduleType: schedule.scheduleType,
        startTime: schedule.scheduleStops[0]?.departureTime || 'N/A',
      })),
    };
  }, [data]);

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt describing the schedules you want to generate.',
        variant: 'destructive',
      });
      return;
    }

    if (!data.selectedRouteId) {
      toast({
        title: 'Route Required',
        description: 'Please select a route first before generating schedules.',
        variant: 'destructive',
      });
      return;
    }

    setGeneration({
      isLoading: true,
      result: null,
      error: null,
      lastResponse: null,
    });

    try {
      const aiService = createAIService(selectedProvider);

      if (!aiService.isAvailable()) {
        throw new Error(`${currentService?.name || selectedProvider} API key is not configured.`);
      }

      const response = await aiService.generateScheduleData({
        prompt: prompt.trim(),
        context: buildContext(),
        outputFormat,
      });

      if (response.success && response.data) {
        setGeneration({
          isLoading: false,
          result: response.data,
          error: null,
          lastResponse: response,
        });

        toast({
          title: 'Schedule Generated',
          description: `Successfully generated using ${response.model}${response.tokensUsed ? ` (${response.tokensUsed} tokens)` : ''}`,
        });
      } else {
        setGeneration({
          isLoading: false,
          result: null,
          error: response.error || 'Unknown error occurred',
          lastResponse: response,
        });
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setGeneration({
        isLoading: false,
        result: null,
        error: error instanceof Error ? error.message : 'Failed to generate schedule',
        lastResponse: null,
      });
    }
  }, [prompt, selectedProvider, outputFormat, data.selectedRouteId, buildContext, currentService, toast]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!generation.result) return;

    try {
      await navigator.clipboard.writeText(generation.result);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Schedule data copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  }, [generation.result, toast]);

  // Handle apply to workspace
  const handleApply = useCallback(() => {
    if (!generation.result) return;

    try {
      let error: string | null = null;

      if (outputFormat === 'yaml') {
        // Wrap the generated data to match expected format
        const wrappedYaml = `schedule_workspace:
  route_id: "${data.selectedRouteId || ''}"
  route_name: "${data.selectedRouteName || ''}"
  route_group_id: "${data.selectedRouteGroupId || ''}"
  route_group_name: "${data.selectedRouteGroupName || ''}"
  ${generation.result.replace(/^schedules:/m, 'schedules:')}`;

        error = updateFromYaml(wrappedYaml);
      } else {
        // Parse and wrap JSON to match expected format
        try {
          const parsed = JSON.parse(generation.result);
          const wrapped = {
            schedule_workspace: {
              route_id: data.selectedRouteId || '',
              route_name: data.selectedRouteName || '',
              route_group_id: data.selectedRouteGroupId || '',
              route_group_name: data.selectedRouteGroupName || '',
              schedules: parsed.schedules || [],
            }
          };
          error = updateFromJson(JSON.stringify(wrapped, null, 2));
        } catch (parseError) {
          error = 'Invalid JSON format in generated data';
        }
      }

      if (error) {
        toast({
          title: 'Apply Failed',
          description: error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Applied Successfully',
          description: 'Generated schedules have been applied to the workspace',
        });
      }
    } catch (error) {
      toast({
        title: 'Apply Failed',
        description: error instanceof Error ? error.message : 'Failed to apply generated data',
        variant: 'destructive',
      });
    }
  }, [generation.result, outputFormat, data, updateFromYaml, updateFromJson, toast]);

  // Handle example prompt click
  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  const hasRouteSelected = !!data.selectedRouteId;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-linear-to-r from-violet-50 to-purple-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-sm font-semibold text-slate-700">AI Schedule Studio</h2>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium border border-violet-200">
            Beta
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          title="AI Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-medium text-slate-700 mb-3 text-sm">AI Service Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  AI Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as AIServiceProvider)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-200 focus:border-violet-500 text-sm"
                >
                  {availableServices.map((service) => (
                    <option
                      key={service.id}
                      value={service.id}
                      disabled={!service.isAvailable}
                    >
                      {service.name} {service.isAvailable ? '' : '(Not configured)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {currentService?.description}
                </p>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Output Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOutputFormat('json')}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${outputFormat === 'json'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setOutputFormat('yaml')}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${outputFormat === 'yaml'
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    YAML
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Route Context Warning */}
        {!hasRouteSelected && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Route Required</p>
              <p className="text-sm text-amber-700">
                Please select a route in Form Mode first. The AI needs route context (stops, locations) to generate accurate schedules.
              </p>
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-700 mb-2">
            Describe the schedules you want to generate
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Generate a weekday morning schedule starting at 6:00 AM with 10-minute intervals between stops..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-200 focus:border-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
            disabled={generation.isLoading || !hasRouteSelected}
          />
        </div>

        {/* Example Prompts */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors truncate max-w-xs"
                disabled={generation.isLoading || !hasRouteSelected}
                title={example}
              >
                {example.length > 50 ? example.slice(0, 50) + '...' : example}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generation.isLoading || !hasRouteSelected || !prompt.trim()}
          className="w-full mb-4 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {generation.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Schedule with AI
            </>
          )}
        </button>

        {/* Error Display */}
        {generation.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Generation Failed</p>
                <p className="text-sm text-red-700 mt-1">{generation.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Result */}
        {generation.result && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Generated Schedule ({outputFormat.toUpperCase()})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleApply}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Apply to Workspace
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={generation.result}
              className="flex-1 min-h-[400px] w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm resize-none"
            />

            {/* Response Metadata */}
            {generation.lastResponse && (
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>Provider: {generation.lastResponse.provider}</span>
                <span>Model: {generation.lastResponse.model}</span>
                {generation.lastResponse.tokensUsed && (
                  <span>Tokens: {generation.lastResponse.tokensUsed}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Initial State - No Result Yet */}
        {!generation.result && !generation.error && !generation.isLoading && hasRouteSelected && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-violet-300" />
              <p className="font-medium text-slate-700">Ready to Generate</p>
              <p className="text-sm mt-1">
                Enter a prompt above and click Generate to create schedules using AI
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
