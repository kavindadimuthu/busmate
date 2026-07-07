'use client';

import { useState, useEffect } from 'react';
import { 
  Bus, 
  Building2, 
  User, 
  Settings, 
  Save, 
  X, 
  Plus, 
  Trash2,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';
import type { 
  BusRequest, 
  BusResponse, 
  OperatorResponse,
  JsonNode 
} from '@busmate/api-client-route';

interface BusFormProps {
  bus?: BusResponse;
  operators: OperatorResponse[];
  operatorsLoading: boolean;
  onSubmit: (busData: BusRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitButtonText: string;
  mode: 'create' | 'edit';
}

interface FormErrors {
  operatorId?: string;
  ntcRegistrationNumber?: string;
  plateNumber?: string;
  capacity?: string;
  model?: string;
  status?: string;
  facilities?: string;
}

// Predefined common facilities
const COMMON_FACILITIES = [
  'ac', 'wifi', 'cctv', 'gps', 'audio_system', 'charging_ports', 
  'wheelchair_accessible', 'air_suspension', 'toilet', 'tv_screens',
  'reading_lights', 'seat_belts', 'emergency_exits', 'fire_extinguisher'
];

const FACILITY_LABELS: { [key: string]: string } = {
  'ac': 'Air Conditioning',
  'wifi': 'WiFi',
  'cctv': 'CCTV Cameras',
  'gps': 'GPS Tracking',
  'audio_system': 'Audio System',
  'charging_ports': 'Charging Ports',
  'wheelchair_accessible': 'Wheelchair Accessible',
  'air_suspension': 'Air Suspension',
  'toilet': 'Toilet',
  'tv_screens': 'TV Screens',
  'reading_lights': 'Reading Lights',
  'seat_belts': 'Seat Belts',
  'emergency_exits': 'Emergency Exits',
  'fire_extinguisher': 'Fire Extinguisher'
};

export function BusForm({
  bus,
  operators,
  operatorsLoading,
  onSubmit,
  onCancel,
  isSubmitting,
  submitButtonText,
  mode
}: BusFormProps) {
  // Form state
  const [formData, setFormData] = useState<BusRequest>({
    operatorId: bus?.operatorId || '',
    ntcRegistrationNumber: bus?.ntcRegistrationNumber || '',
    plateNumber: bus?.plateNumber || '',
    capacity: bus?.capacity || undefined,
    model: bus?.model || '',
    status: bus?.status || 'active',
  });

  // Facilities state (object with boolean values)
  const [facilities, setFacilities] = useState<{ [key: string]: boolean }>({});
  const [newFacilityKey, setNewFacilityKey] = useState('');
  const [newFacilityLabel, setNewFacilityLabel] = useState('');

  // Form validation and UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize facilities from bus data
  useEffect(() => {
    if (bus?.facilities) {
      try {
        let facilitiesData: { [key: string]: boolean } = {};
        
        if (typeof bus.facilities === 'string') {
          facilitiesData = JSON.parse(bus.facilities);
        } else if (typeof bus.facilities === 'object' && bus.facilities !== null) {
          facilitiesData = bus.facilities as { [key: string]: boolean };
        }
        
        // Ensure all values are boolean
        const cleanedFacilities: { [key: string]: boolean } = {};
        Object.entries(facilitiesData).forEach(([key, value]) => {
          cleanedFacilities[key] = Boolean(value);
        });
        
        setFacilities(cleanedFacilities);
      } catch (error) {
        console.warn('Error parsing facilities:', error);
        setFacilities({});
      }
    } else {
      // Initialize with common facilities set to false for new buses
      const initialFacilities: { [key: string]: boolean } = {};
      COMMON_FACILITIES.forEach(facility => {
        initialFacilities[facility] = false;
      });
      setFacilities(initialFacilities);
    }
  }, [bus]);

  // Form validation
  useEffect(() => {
    const newErrors: FormErrors = {};

    // Required fields validation
    if (!formData.operatorId.trim()) {
      newErrors.operatorId = 'Operator is required';
    }

    if (!formData.ntcRegistrationNumber.trim()) {
      newErrors.ntcRegistrationNumber = 'NTC Registration Number is required';
    }

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = 'Plate Number is required';
    }

    // Capacity validation
    if (formData.capacity !== undefined) {
      if (formData.capacity <= 0) {
        newErrors.capacity = 'Capacity must be greater than 0';
      } else if (formData.capacity > 200) {
        newErrors.capacity = 'Capacity seems unusually high (max 200)';
      }
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
  }, [formData]);

  // Handle input changes
  const handleInputChange = (field: keyof BusRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSubmitError(null);
  };

  // Handle facility toggle
  const toggleFacility = (facilityKey: string) => {
    setFacilities(prev => ({
      ...prev,
      [facilityKey]: !prev[facilityKey]
    }));
  };

  // Add custom facility
  const addCustomFacility = () => {
    if (newFacilityKey.trim() && newFacilityLabel.trim() && !facilities.hasOwnProperty(newFacilityKey)) {
      const facilityKey = newFacilityKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      if (facilityKey && !facilities.hasOwnProperty(facilityKey)) {
        setFacilities(prev => ({
          ...prev,
          [facilityKey]: true
        }));
        
        // Add to labels if it's a custom one
        if (!FACILITY_LABELS[facilityKey]) {
          FACILITY_LABELS[facilityKey] = newFacilityLabel.trim();
        }
        
        setNewFacilityKey('');
        setNewFacilityLabel('');
      }
    }
  };

  // Remove custom facility
  const removeCustomFacility = (facilityKey: string) => {
    if (!COMMON_FACILITIES.includes(facilityKey)) {
      setFacilities(prev => {
        const newFacilities = { ...prev };
        delete newFacilities[facilityKey];
        return newFacilities;
      });
    }
  };

  // Get facility display name
  const getFacilityLabel = (key: string): string => {
    return FACILITY_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || isSubmitting) return;

    try {
      setSubmitError(null);
      
      // Prepare facilities data as JsonNode (only include facilities, both true and false)
      const facilitiesJson: JsonNode = Object.keys(facilities).length > 0 ? facilities : undefined;
      
      const busData: BusRequest = {
        ...formData,
        facilities: facilitiesJson,
        capacity: formData.capacity || undefined,
      };

      await onSubmit(busData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save bus. Please try again.');
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'text-success' },
    { value: 'inactive', label: 'Inactive', color: 'text-muted-foreground' },
    { value: 'pending', label: 'Pending', color: 'text-warning' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-destructive' },
  ];

  // Get enabled facilities (true values only)
  const enabledFacilities = Object.entries(facilities).filter(([key, enabled]) => enabled);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Submit Error Alert */}
      {submitError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive/70 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">Submission Error</h3>
              <p className="text-sm text-destructive mt-1">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center">
            <Bus className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operator Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Operator *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 w-4 h-4" />
              <select
                value={formData.operatorId}
                onChange={(e) => handleInputChange('operatorId', e.target.value)}
                disabled={operatorsLoading}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.operatorId ? 'border-destructive/30' : 'border-border'
                }`}
              >
                <option value="">
                  {operatorsLoading ? 'Loading operators...' : 'Select an operator'}
                </option>
                {operators.map((operator) => (
                  <option key={operator.id} value={operator.id}>
                    {operator.name} ({operator.operatorType})
                  </option>
                ))}
              </select>
            </div>
            {errors.operatorId && (
              <p className="text-destructive text-sm mt-1">{errors.operatorId}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.status ? 'border-destructive/30' : 'border-border'
              }`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-destructive text-sm mt-1">{errors.status}</p>
            )}
          </div>
        </div>
      </div>

      {/* Registration Details Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-success/15 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Registration Details</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NTC Registration Number */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              NTC Registration Number *
            </label>
            <input
              type="text"
              value={formData.ntcRegistrationNumber}
              onChange={(e) => handleInputChange('ntcRegistrationNumber', e.target.value)}
              placeholder="e.g., NTC-12345-2024"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.ntcRegistrationNumber ? 'border-destructive/30' : 'border-border'
              }`}
            />
            {errors.ntcRegistrationNumber && (
              <p className="text-destructive text-sm mt-1">{errors.ntcRegistrationNumber}</p>
            )}
          </div>

          {/* Plate Number */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Plate Number *
            </label>
            <input
              type="text"
              value={formData.plateNumber}
              onChange={(e) => handleInputChange('plateNumber', e.target.value)}
              placeholder="e.g., ABC-1234"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.plateNumber ? 'border-destructive/30' : 'border-border'
              }`}
            />
            {errors.plateNumber && (
              <p className="text-destructive text-sm mt-1">{errors.plateNumber}</p>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Specifications Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-[hsl(var(--purple-100))] rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-[hsl(var(--purple-600))]" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Vehicle Specifications</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Passenger Capacity
            </label>
            <input
              type="number"
              value={formData.capacity || ''}
              onChange={(e) => handleInputChange('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="e.g., 50"
              min="1"
              max="200"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.capacity ? 'border-destructive/30' : 'border-border'
              }`}
            />
            {errors.capacity && (
              <p className="text-destructive text-sm mt-1">{errors.capacity}</p>
            )}
            <p className="text-muted-foreground text-sm mt-1">Total number of passenger seats</p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Bus Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              placeholder="e.g., Tata Ultra, Ashok Leyland"
              className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <p className="text-muted-foreground text-sm mt-1">Vehicle manufacturer and model</p>
          </div>
        </div>
      </div>

      {/* Facilities Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-warning/15 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-warning" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Facilities & Features</h3>
        </div>

        <div className="space-y-6">
          {/* Common Facilities Grid */}
          <div>
            <h4 className="text-sm font-medium text-foreground/80 mb-3">Available Facilities</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(facilities).map(([key, enabled]) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    enabled 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border bg-card text-foreground/80 hover:bg-muted'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    enabled 
                      ? 'border-primary bg-primary/80' 
                      : 'border-border'
                  }`}>
                    {enabled && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{getFacilityLabel(key)}</span>
                    {!COMMON_FACILITIES.includes(key) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          removeCustomFacility(key);
                        }}
                        className="ml-2 text-destructive/80 hover:text-destructive"
                        title="Remove custom facility"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleFacility(key)}
                    className="sr-only"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Add Custom Facility */}
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-medium text-foreground/80 mb-3">Add Custom Facility</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={newFacilityKey}
                onChange={(e) => setNewFacilityKey(e.target.value)}
                placeholder="Facility key (e.g., luxury_seats)"
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newFacilityLabel}
                onChange={(e) => setNewFacilityLabel(e.target.value)}
                placeholder="Display name (e.g., Luxury Seats)"
                className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addCustomFacility}
                disabled={!newFacilityKey.trim() || !newFacilityLabel.trim()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add Facility
              </button>
            </div>
          </div>

          {/* Enabled Facilities Summary */}
          {enabledFacilities.length > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-success mb-2">
                Enabled Facilities ({enabledFacilities.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {enabledFacilities.map(([key, enabled]) => (
                  <span
                    key={key}
                    className="px-3 py-1 bg-success/15 text-success rounded-full text-sm font-medium"
                  >
                    {getFacilityLabel(key)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-primary/70 mt-0.5 mr-3 shrink-0" />
              <div className="text-sm text-primary">
                <p className="font-medium mb-1">About Facilities</p>
                <p>Select the facilities and features available in this bus. You can add custom facilities using the form above. Only enabled facilities will be displayed to passengers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 text-foreground/80 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {mode === 'create' ? 'Creating...' : 'Updating...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {submitButtonText}
            </>
          )}
        </button>
      </div>

      {/* Form Validation Summary */}
      {!isFormValid && Object.keys(errors).length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-warning/70 mt-0.5 mr-3 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-warning mb-2">
                Please fix the following errors:
              </h3>
              <ul className="text-sm text-warning space-y-1">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}