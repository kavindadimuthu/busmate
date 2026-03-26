'use client';

import { useRouteWorkspace } from "@/context/RouteWorkspace/useRouteWorkspace";
import { useEffect, useState, useCallback } from "react";
import { Button, Badge, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@busmate/ui';
import { Copy, Check, AlertTriangle } from "lucide-react";

type TextualFormat = 'yaml' | 'json';

export default function RouteTextualMode() {
  const { data, updateFromYaml, getYaml, updateFromJson, getJson } = useRouteWorkspace();
  const [textContent, setTextContent] = useState('');
  const [format, setFormat] = useState<TextualFormat>('yaml');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync context data to textarea when form changes or format changes
  useEffect(() => {
    if (format === 'yaml') {
      setTextContent(getYaml());
    } else {
      setTextContent(getJson());
    }
    setParseError(null);
  }, [data, getYaml, getJson, format]);

  // Handle textarea changes and update context
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);
    setParseError(null);

    try {
      if (format === 'yaml') {
        updateFromYaml(newText);
      } else {
        updateFromJson(newText);
      }
    } catch (error: any) {
      setParseError(error.message || `Invalid ${format.toUpperCase()} syntax`);
    }
  };

  // Handle format toggle
  const handleFormatChange = (newFormat: TextualFormat) => {
    if (newFormat !== format) {
      setFormat(newFormat);
    }
  };

  // Copy content to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
    }
  }, [textContent]);

  const lineCount = textContent.split('\n').length;

  const placeholder = format === 'yaml'
    ? `# Example:
route_group:
  name: Colombo - Kandy Express Routes
  name_sinhala: කොළඹ - මහනුවර එක්ස්ප්‍රස් මාර්ග
  name_tamil: கொழும்பு - கண்டி எக்ஸ்பிரஸ் வழிகள்
  description: Main express routes between Colombo and Kandy`
    : `{
  "route_group": {
    "name": "Colombo - Kandy Express Routes",
    "name_sinhala": "කොළඹ - මහනුවර එක්ස්ප්‍රස් මාර්ග",
    "name_tamil": "கொழும்பு - கண்டி எக்ஸ்பிரஸ் வழிகள்",
    "description": "Main express routes between Colombo and Kandy"
  }
}`;

  return (
    <TooltipProvider>
      <div className="flex flex-col rounded-lg bg-card border border-border shadow-sm overflow-hidden h-full">
        {/* Header */}
        <div className="px-5 py-3 bg-muted border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {format === 'yaml' ? 'YAML Editor' : 'JSON Editor'}
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 tabular-nums">
              {lineCount} lines
            </Badge>
            {parseError && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                <AlertTriangle className="h-3 w-3" />
                Parse Error
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Copy button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? 'Copied!' : 'Copy to clipboard'}</TooltipContent>
            </Tooltip>

            {/* Format toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => handleFormatChange('yaml')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  format === 'yaml'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                YAML
              </button>
              <button
                type="button"
                onClick={() => handleFormatChange('json')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  format === 'json'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Parse error banner */}
        {parseError && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-start gap-2 shrink-0">
            <AlertTriangle className="h-4 w-4 text-destructive/80 shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-mono break-all">{parseError}</p>
          </div>
        )}

        {/* Editor area — takes remaining height */}
        <div className="flex-1 p-4 min-h-0">
          <textarea
            className={`w-full h-full min-h-[500px] border rounded-lg px-4 py-3 bg-muted font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:border-primary transition-all duration-200 resize-none ${
              parseError
                ? 'border-destructive/30 focus:ring-red-200'
                : 'border-border focus:ring-blue-200'
            }`}
            value={textContent}
            onChange={handleTextChange}
            placeholder={placeholder}
            spellCheck={false}
          />
        </div>

        {/* Footer status */}
        <div className="px-5 py-1.5 bg-muted border-t border-border flex items-center justify-between text-[10px] text-muted-foreground/70 shrink-0">
          <span>Changes sync with Form Mode in real-time</span>
          <span className="tabular-nums">{textContent.length} characters</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
