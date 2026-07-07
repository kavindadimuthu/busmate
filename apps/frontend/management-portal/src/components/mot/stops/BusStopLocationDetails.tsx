'use client';

import { MapPin } from 'lucide-react';
import type { StopResponse } from '@busmate/api-client-route';
import CopyableField from './CopyableField';

interface BusStopLocationDetailsProps {
  busStop: StopResponse;
  activeLanguageTab: 'english' | 'sinhala' | 'tamil';
  onTabChange: (tab: 'english' | 'sinhala' | 'tamil') => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

const LANGUAGE_TABS = [
  { key: 'english' as const, label: 'English' },
  { key: 'sinhala' as const, label: 'සිංහල' },
  { key: 'tamil' as const, label: 'தமிழ்' },
] as const;

function LocationFieldPair({
  fields,
  copiedField,
  onCopy,
}: {
  fields: { label: string; value?: string; field: string; fallback?: string }[];
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(({ label, value, field, fallback }) =>
        value ? (
          <div key={field}>
            <label className="block text-sm font-medium text-foreground/80 mb-1">{label}</label>
            <CopyableField value={value} field={field} copiedField={copiedField} onCopy={onCopy} className="text-foreground" />
          </div>
        ) : fallback ? (
          <div key={field} className="text-muted-foreground italic text-sm">{fallback}</div>
        ) : null
      )}
    </div>
  );
}

function EnglishTab({ location, copiedField, onCopy }: { location: StopResponse['location']; copiedField: string | null; onCopy: (t: string, f: string) => void }) {
  return (
    <div className="space-y-4">
      {location?.address && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">Address</label>
          <CopyableField value={location.address} field="address" copiedField={copiedField} onCopy={onCopy} className="text-foreground" />
        </div>
      )}
      <LocationFieldPair
        copiedField={copiedField}
        onCopy={onCopy}
        fields={[
          { label: 'City', value: location?.city, field: 'city' },
          { label: 'State/Province', value: location?.state, field: 'state' },
        ]}
      />
      <LocationFieldPair
        copiedField={copiedField}
        onCopy={onCopy}
        fields={[
          { label: 'ZIP/Postal Code', value: location?.zipCode, field: 'zipCode' },
          { label: 'Country', value: location?.country, field: 'country' },
        ]}
      />
    </div>
  );
}

function SinhalaTab({ location, copiedField, onCopy }: { location: StopResponse['location']; copiedField: string | null; onCopy: (t: string, f: string) => void }) {
  return (
    <div className="space-y-4">
      {location?.addressSinhala ? (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">ලිපිනය (Address)</label>
          <CopyableField value={location.addressSinhala} field="addressSinhala" copiedField={copiedField} onCopy={onCopy} className="text-foreground" />
        </div>
      ) : (
        <div className="text-muted-foreground italic">No Sinhala address available</div>
      )}
      <LocationFieldPair
        copiedField={copiedField}
        onCopy={onCopy}
        fields={[
          { label: 'නගරය (City)', value: location?.citySinhala, field: 'citySinhala', fallback: 'No city available' },
          { label: 'පළාත (State/Province)', value: location?.stateSinhala, field: 'stateSinhala', fallback: 'No state available' },
        ]}
      />
      <LocationFieldPair
        copiedField={copiedField}
        onCopy={onCopy}
        fields={[
          { label: 'තැපැල් කේතය (ZIP/Postal Code)', value: location?.zipCode, field: 'zipCode-sinhala' },
          { label: 'රට (Country)', value: location?.countrySinhala, field: 'countrySinhala', fallback: 'No country available' },
        ]}
      />
    </div>
  );
}

function TamilTab({ location, copiedField, onCopy }: { location: StopResponse['location']; copiedField: string | null; onCopy: (t: string, f: string) => void }) {
  return (
    <div className="space-y-4">
      {location?.addressTamil ? (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1">முகவரி (Address)</label>
          <CopyableField value={location.addressTamil} field="addressTamil" copiedField={copiedField} onCopy={onCopy} className="text-foreground" />
        </div>
      ) : (
        <div className="text-muted-foreground italic">No Tamil address available</div>
      )}
      <LocationFieldPair
        copiedField={copiedField}
        onCopy={onCopy}
        fields={[
          { label: 'நகரம் (City)', value: location?.cityTamil, field: 'cityTamil', fallback: 'No city available' },
          { label: 'மாநிலம் (State/Province)', value: location?.stateTamil, field: 'stateTamil', fallback: 'No state available' },
        ]}
      />
      <LocationFieldPair
        copiedField={copiedField}
        onCopy={onCopy}
        fields={[
          { label: 'அஞ்சல் குறியீடு (ZIP/Postal Code)', value: location?.zipCode, field: 'zipCode-tamil' },
          { label: 'நாடு (Country)', value: location?.countryTamil, field: 'countryTamil', fallback: 'No country available' },
        ]}
      />
    </div>
  );
}

const TAB_CONTENT = {
  english: EnglishTab,
  sinhala: SinhalaTab,
  tamil: TamilTab,
} as const;

export default function BusStopLocationDetails({
  busStop,
  activeLanguageTab,
  onTabChange,
  copiedField,
  onCopy,
}: BusStopLocationDetailsProps) {
  const TabContent = TAB_CONTENT[activeLanguageTab];

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Location Details
      </h2>

      {/* Language Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {LANGUAGE_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
              activeLanguageTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TabContent location={busStop.location} copiedField={copiedField} onCopy={onCopy} />
    </div>
  );
}
