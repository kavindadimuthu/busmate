'use client';

import { Calendar, Check } from 'lucide-react';
import { ScheduleFormData } from './ScheduleForm';

interface ScheduleCalendarFormProps {
  formData: ScheduleFormData;
  onChange: (data: ScheduleFormData) => void;
  validationErrors: Record<string, string>;
}

export function ScheduleCalendarForm({
  formData,
  onChange,
  validationErrors
}: ScheduleCalendarFormProps) {

  const handleDayChange = (day: keyof typeof formData.calendar, checked: boolean) => {
    onChange({
      ...formData,
      calendar: {
        ...formData.calendar,
        [day]: checked
      }
    });
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(formData.calendar).every(day => day);
    const newValue = !allSelected;
    
    onChange({
      ...formData,
      calendar: {
        monday: newValue,
        tuesday: newValue,
        wednesday: newValue,
        thursday: newValue,
        friday: newValue,
        saturday: newValue,
        sunday: newValue
      }
    });
  };

  const handleWeekdays = () => {
    onChange({
      ...formData,
      calendar: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      }
    });
  };

  const handleWeekends = () => {
    onChange({
      ...formData,
      calendar: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true
      }
    });
  };

  const days = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' }
  ];

  const selectedDaysCount = Object.values(formData.calendar).filter(day => day).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Operating Schedule
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Select the days of the week when this schedule should operate. 
          This defines when trips will be generated for this schedule.
        </p>
      </div>

      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={handleSelectAll}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {selectedDaysCount === 7 ? 'Deselect All' : 'Select All'}
        </button>
        <button
          type="button"
          onClick={handleWeekdays}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Weekdays Only
        </button>
        <button
          type="button"
          onClick={handleWeekends}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Weekends Only
        </button>
      </div>

      {/* Days Selection */}
      <div className={`space-y-3 ${validationErrors.calendar ? 'border-2 border-red-200 rounded-lg p-4' : ''}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {days.map((day) => {
            const isSelected = formData.calendar[day.key as keyof typeof formData.calendar];
            
            return (
              <div
                key={day.key}
                className={`
                  relative border rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleDayChange(day.key as keyof typeof formData.calendar, !isSelected)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {day.short}
                    </div>
                    <div className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                      {day.label}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="shrink-0">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Hidden checkbox for accessibility */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleDayChange(day.key as keyof typeof formData.calendar, e.target.checked)}
                  className="absolute opacity-0 w-full h-full cursor-pointer"
                  aria-label={`Select ${day.label}`}
                />
              </div>
            );
          })}
        </div>

        {validationErrors.calendar && (
          <p className="text-sm text-red-600 mt-2">{validationErrors.calendar}</p>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Operating Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Selected Days:</span>
            <span className="font-medium text-gray-900">
              {selectedDaysCount} {selectedDaysCount === 1 ? 'day' : 'days'} per week
            </span>
          </div>
          
          {selectedDaysCount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Days:</span>
              <span className="font-medium text-gray-900">
                {days
                  .filter(day => formData.calendar[day.key as keyof typeof formData.calendar])
                  .map(day => day.short)
                  .join(', ')
                }
              </span>
            </div>
          )}

          {formData.effectiveStartDate && formData.effectiveEndDate && selectedDaysCount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Trips:</span>
              <span className="font-medium text-gray-900">
                {(() => {
                  const startDate = new Date(formData.effectiveStartDate);
                  const endDate = new Date(formData.effectiveEndDate);
                  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                  const estimatedTrips = diffWeeks * selectedDaysCount;
                  return `~${estimatedTrips} trips`;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">How Operating Days Work</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select the days when this schedule should operate</li>
          <li>• Trips will be automatically generated for selected days within the effective period</li>
          <li>• You can modify individual trips later if needed</li>
          <li>• Schedule exceptions can override these settings for specific dates</li>
        </ul>
      </div>
    </div>
  );
}