'use client';

import type { RouteGroupFormData } from './RouteForm';

interface RouteGroupInfoProps {
  formData: RouteGroupFormData;
  validationErrors: Record<string, string>;
  onChange: (field: keyof Pick<RouteGroupFormData, 'name' | 'description'>, value: string) => void;
}

export function RouteGroupInfo({ formData, validationErrors, onChange }: RouteGroupInfoProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Group Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Group Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Route Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="e.g., Colombo-Kandy Express"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.groupName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.groupName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.groupName}</p>
          )}
        </div>

        {/* Group Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Brief description of the route group..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}