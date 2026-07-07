'use client';

import { useScheduleWorkspace } from "@/context/ScheduleWorkspace/useScheduleWorkspace";
import { useEffect, useState } from "react";

type TextualFormat = 'yaml' | 'json';

export default function ScheduleTextualMode() {
  const { data, updateFromYaml, getYaml, updateFromJson, getJson } = useScheduleWorkspace();
  const [textContent, setTextContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [format, setFormat] = useState<TextualFormat>('yaml');

  // Sync context data to textarea when form changes or format changes
  useEffect(() => {
    const newContent = format === 'yaml' ? getYaml() : getJson();
    setTextContent(newContent);
    setParseError(null);
  }, [data, getYaml, getJson, format]);

  // Handle textarea changes and update context
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);

    // Parse and update context based on current format
    try {
      const error = format === 'yaml'
        ? updateFromYaml(newText)
        : updateFromJson(newText);

      if (error) {
        setParseError(error);
      } else {
        setParseError(null);
      }
    } catch (error) {
      console.error(`Failed to parse ${format.toUpperCase()}:`, error);
      setParseError(error instanceof Error ? error.message : `Failed to parse ${format.toUpperCase()}`);
    }
  };

  // Handle format toggle
  const handleFormatChange = (newFormat: TextualFormat) => {
    if (newFormat !== format) {
      setFormat(newFormat);
      // Content will be updated via useEffect
      setParseError(null);
    }
  };

  const hasRouteSelected = !!data.selectedRouteId;
  const formatLabel = format.toUpperCase();

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header with instructions and format toggle */}
      <div className="px-5 py-4 bg-muted border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-muted-foreground">Schedule Textual Mode</span>
            {parseError && (
              <span className="text-xs text-destructive bg-destructive/10 px-2.5 py-1 rounded-md font-medium border border-destructive/20">
                ⚠️ {parseError}
              </span>
            )}
            {!parseError && textContent.trim() && (
              <span className="text-xs text-success bg-success/10 px-2.5 py-1 rounded-md font-medium border border-success/20">
                ✓ Valid {formatLabel}
              </span>
            )}
          </div>

          {/* Format Toggle Button */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => handleFormatChange('yaml')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${format === 'yaml'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              YAML
            </button>
            <button
              onClick={() => handleFormatChange('json')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${format === 'json'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              JSON
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Enter or paste schedule data in {formatLabel} format. Changes will sync with Form Mode in real-time.
        </p>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Route context warning */}
        {!hasRouteSelected && (
          <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning">
              <strong>Note:</strong> Please select a route in Form Mode first.
              The route context (stops, route info) is required to properly interpret schedule data.
            </p>
          </div>
        )}

        {/* Text Editor */}
        <div className="flex-1 min-h-0">
          <textarea
            className={`w-full h-[700px] border-2 rounded-lg px-4 py-3 outline-none font-mono text-sm resize-none transition-all duration-200
              ${parseError
                ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-blue-200'
              }
              ${!hasRouteSelected ? 'bg-muted' : 'bg-card'}
            `}
            value={textContent}
            onChange={handleTextChange}
            placeholder={format === 'yaml' ? yamlPlaceholder : jsonPlaceholder}
            spellCheck={false}
          />
        </div>

        {/* Help section */}
        <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
          <details className="text-sm">
            <summary className="font-medium text-muted-foreground cursor-pointer hover:text-foreground">
              {formatLabel} Format Reference
            </summary>
            <div className="mt-2 text-muted-foreground space-y-2">
              <div>
                <strong className="text-muted-foreground">Schedule Types:</strong> REGULAR, SPECIAL
              </div>
              <div>
                <strong className="text-muted-foreground">Status Options:</strong> PENDING, ACTIVE, INACTIVE, CANCELLED
              </div>
              <div>
                <strong className="text-muted-foreground">Time Format:</strong> HH:mm or HH:mm:ss (e.g., "06:00" or "06:00:00")
              </div>
              <div>
                <strong className="text-muted-foreground">Date Format:</strong> YYYY-MM-DD (e.g., "2024-01-15")
              </div>
              <div>
                <strong className="text-muted-foreground">Exception Types:</strong> ADDED (add service), REMOVED (remove service)
              </div>
              <div>
                <strong className="text-muted-foreground">Calendar:</strong> Set days to true/false to control operating days
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

// Placeholder text for YAML format
const yamlPlaceholder = `# Schedule Workspace YAML Format
# Select a route first, then edit schedules below

schedule_workspace:
      route_id: ""
      route_name: ""
      route_group_id: ""
      route_group_name: ""

      schedules:
      - schedule:
      name: "Morning Express"
      schedule_type: REGULAR
      status: PENDING
      description: "Weekday morning service"

      effective_start_date: "2024-01-01"
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
      stop_order: 0
      arrival_time: "06:00"
      departure_time: "06:02"
      - stop:
      stop_order: 1
      arrival_time: "06:15"
      departure_time: "06:16"

      exceptions:
      - exception:
      exception_date: "2024-12-25"
      exception_type: REMOVED
      description: "Christmas Day"`;

// Placeholder text for JSON format
const jsonPlaceholder = `{
        "schedule_workspace": {
        "route_id": "",
      "route_name": "",
      "route_group_id": "",
      "route_group_name": "",
      "schedules": [
      {
        "schedule": {
        "name": "Morning Express",
      "schedule_type": "REGULAR",
      "status": "PENDING",
      "description": "Weekday morning service",
      "effective_start_date": "2024-01-01",
      "effective_end_date": "",
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
        "stop_order": 0,
      "arrival_time": "06:00",
      "departure_time": "06:02"
            },
      {
        "stop_order": 1,
      "arrival_time": "06:15",
      "departure_time": "06:16"
            }
      ],
      "exceptions": [
      {
        "exception_date": "2024-12-25",
      "exception_type": "REMOVED",
      "description": "Christmas Day"
            }
      ]
        }
      }
      ]
  }
}`;
