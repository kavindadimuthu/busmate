'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouteWorkspace } from '@/context/RouteWorkspace/useRouteWorkspace';
import { useToast } from '@/hooks/use-toast';
import {
  createRouteAIService,
  getAvailableRouteAIServices,
  getDefaultRouteProvider,
  AIRouteGenerationResponse,
} from '@/services/ai/routeAIService';
import { AIServiceProvider } from '@/services/ai/types';
import { Loader2, Sparkles, Copy, Check, ArrowRight, RefreshCw, Settings, AlertCircle, Route as RouteIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type OutputFormat = 'json' | 'yaml';

interface GenerationState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  lastResponse: AIRouteGenerationResponse | null;
}

// ============================================================================
// EXAMPLE PROMPTS
// ============================================================================

const EXAMPLE_PROMPTS = [
  'Generate a bus route from Colombo Fort to Kandy with major stops along the way',
  'Create an outbound and inbound route pair for Colombo to Galle via the coastal road',
  'Generate a local route from Nugegoda to Maharagama with 10 intermediate stops',
  'Create an expressway route from Colombo to Katunayake Airport',
  'Generate a route from Colombo Central Bus Stand to Kurunegala via Kegalle with all major towns',
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function RouteAIStudio() {
  const { data, updateFromYaml, updateFromJson, mode } = useRouteWorkspace();
  const { toast } = useToast();

  // State
  const [prompt, setPrompt] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('yaml');
  const [selectedProvider, setSelectedProvider] = useState<AIServiceProvider>(() =>
    getDefaultRouteProvider() || 'gemini'
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
  const availableServices = useMemo(() => getAvailableRouteAIServices(), []);
  const currentService = useMemo(
    () => availableServices.find(s => s.id === selectedProvider),
    [availableServices, selectedProvider]
  );

  // Build context for AI generation
  const buildContext = useCallback(() => {
    return {
      routeGroupId: data.routeGroup.id,
      routeGroupName: data.routeGroup.name || null,
      routeGroupNameSinhala: data.routeGroup.nameSinhala || null,
      routeGroupNameTamil: data.routeGroup.nameTamil || null,
      existingRoutes: data.routeGroup.routes?.map(route => ({
        name: route.name,
        direction: route.direction,
        stopsCount: route.routeStops?.length || 0,
        startStop: route.routeStops?.[0]?.stop?.name || undefined,
        endStop: route.routeStops?.[route.routeStops.length - 1]?.stop?.name || undefined,
      })) || [],
    };
  }, [data]);

  // Handle generate
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt describing the routes you want to generate.',
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
      const aiService = createRouteAIService(selectedProvider);

      if (!aiService.isAvailable()) {
        throw new Error(`${currentService?.name || selectedProvider} API key is not configured.`);
      }

      const response = await aiService.generateRouteData({
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
          title: 'Route Generated',
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
        error: error instanceof Error ? error.message : 'Failed to generate route',
        lastResponse: null,
      });
    }
  }, [prompt, selectedProvider, outputFormat, buildContext, currentService, toast]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!generation.result) return;

    try {
      await navigator.clipboard.writeText(generation.result);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Route data copied to clipboard',
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
      if (outputFormat === 'yaml') {
        updateFromYaml(generation.result);
        toast({
          title: 'Applied Successfully',
          description: 'Generated route data has been applied to the workspace',
        });
      } else {
        updateFromJson(generation.result);
        toast({
          title: 'Applied Successfully',
          description: 'Generated route data has been applied to the workspace',
        });
      }
    } catch (error) {
      toast({
        title: 'Apply Failed',
        description: error instanceof Error ? error.message : 'Failed to apply generated data',
        variant: 'destructive',
      });
    }
  }, [generation.result, outputFormat, updateFromYaml, updateFromJson, toast]);

  // Handle example prompt click
  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // Check if route group has some basic data
  const hasRouteGroupContext = data.routeGroup.name?.trim() || data.routeGroup.routes?.length > 0;

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-linear-to-r from-violet-50 to-purple-50 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-sm font-semibold text-muted-foreground">AI Route Studio</h2>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium border border-violet-200">
            Beta
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
          title="AI Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-auto">
        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 p-4 bg-muted rounded-lg border border-border">
            <h3 className="font-medium text-muted-foreground mb-3 text-sm">AI Service Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  AI Provider
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as AIServiceProvider)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-primary text-sm"
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
                <p className="text-xs text-muted-foreground mt-1">
                  {currentService?.description}
                </p>
              </div>

              {/* Output Format */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Output Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOutputFormat('json')}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${outputFormat === 'json'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setOutputFormat('yaml')}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${outputFormat === 'yaml'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    YAML
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Context Info */}
        {hasRouteGroupContext && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2">
            <RouteIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Route Group Context</p>
              <p className="text-sm text-primary">
                {data.routeGroup.name && `Name: ${data.routeGroup.name}`}
                {data.routeGroup.routes?.length > 0 && ` • ${data.routeGroup.routes.length} existing route(s)`}
              </p>
              <p className="text-xs text-primary mt-1">
                AI will use this context to generate routes that complement your existing data.
              </p>
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Describe the routes you want to generate
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Generate a bus route from Colombo Fort to Kandy with major stops along the way..."
            className="w-full h-32 px-4 py-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-blue-200 focus:border-primary disabled:bg-muted disabled:text-muted-foreground"
            disabled={generation.isLoading}
          />
        </div>

        {/* Example Prompts */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example)}
                className="text-xs px-3 py-1.5 bg-muted hover:bg-secondary text-foreground/80 rounded-full transition-colors truncate max-w-xs"
                disabled={generation.isLoading}
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
          disabled={generation.isLoading || !prompt.trim()}
          className="w-full mb-4 px-4 py-3 bg-[hsl(var(--purple-600))] hover:bg-[hsl(var(--purple-700))] disabled:bg-secondary text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {generation.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Route with AI
            </>
          )}
        </button>

        {/* Error Display */}
        {generation.error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Generation Failed</p>
                <p className="text-sm text-destructive mt-1">{generation.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Result */}
        {generation.result && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground/80">
                Generated Route ({outputFormat.toUpperCase()})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted flex items-center gap-1 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-success" />
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
                  className="px-3 py-1.5 text-sm bg-success hover:bg-success text-white rounded-lg flex items-center gap-1 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Apply to Workspace
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={generation.result}
              className="flex-1 min-h-[400px] w-full px-4 py-3 bg-muted border border-border rounded-lg font-mono text-sm resize-none"
            />

            {/* Response Metadata */}
            {generation.lastResponse && (
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
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
        {!generation.result && !generation.error && !generation.isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-primary/50" />
              <p className="font-medium text-muted-foreground">Ready to Generate</p>
              <p className="text-sm mt-1">
                Enter a prompt above and click Generate to create routes using AI
              </p>
              <p className="text-xs mt-2 text-muted-foreground/70">
                Describe your route with starting point, ending point, and any intermediate stops or landmarks
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
