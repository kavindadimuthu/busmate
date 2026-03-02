'use client';

import { useRouteWorkspace } from "@/context/RouteWorkspace/useRouteWorkspace";
import { useEffect, useState } from "react";

type TextualFormat = 'yaml' | 'json';

export default function RouteTextualMode() {
  const { data, updateFromYaml, getYaml, updateFromJson, getJson } = useRouteWorkspace();
  const [textContent, setTextContent] = useState('');
  const [format, setFormat] = useState<TextualFormat>('yaml');

  // Sync context data to textarea when form changes or format changes
  useEffect(() => {
    if (format === 'yaml') {
      setTextContent(getYaml());
    } else {
      setTextContent(getJson());
    }
  }, [data, getYaml, getJson, format]);

  // Handle textarea changes and update context
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextContent(newText);

    // Parse and update context based on format
    try {
      if (format === 'yaml') {
        updateFromYaml(newText);
      } else {
        updateFromJson(newText);
      }
    } catch (error) {
      console.error(`Failed to parse ${format.toUpperCase()}:`, error);
    }
  };

  // Handle format toggle
  const handleFormatChange = (newFormat: TextualFormat) => {
    if (newFormat !== format) {
      setFormat(newFormat);
      // Content will be updated by the useEffect
    }
  };

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
    <div className="flex flex-col rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">
            {format === 'yaml' ? 'YAML Editor' : 'JSON Editor'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter or paste route group data in {format.toUpperCase()} format. Changes sync with Form Mode in real-time.
          </p>
        </div>
        {/* Format Toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleFormatChange('yaml')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              format === 'yaml'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            YAML
          </button>
          <button
            type="button"
            onClick={() => handleFormatChange('json')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              format === 'json'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON
          </button>
        </div>
      </div>
      {/* Full available screen sized text editor area to type or paste full route group data with route data and routestop data in textual format */}
      <div className="p-4">
        <textarea
          className="w-full h-[700px] border border-slate-300 rounded-lg px-3 py-2.5 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
          value={textContent}
          onChange={handleTextChange}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
