import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { PassengerApIsService, PassengerStopResponse } from '../lib/api-client/route-management';

interface StopSearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onStopSelect: (stop: PassengerStopResponse) => void;
  style?: any;
}

export default function StopSearchInput({
  label,
  placeholder,
  value,
  onStopSelect,
  style,
}: StopSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [stops, setStops] = useState<PassengerStopResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStop, setSelectedStop] = useState<PassengerStopResponse | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Update query when value prop changes (from parent)
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
      if (!value) {
        setSelectedStop(null);
        setStops([]);
        setShowDropdown(false);
      }
    }
  }, [value]);

  useEffect(() => {
    // Clear any existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Only search if query has at least 2 characters and is not the same as selected stop
    if (query.length >= 2 && (!selectedStop || query !== selectedStop.name)) {
      // Debounce the search to avoid too many API calls
      const timer = setTimeout(() => {
        searchStops(query);
      }, 300); // 300ms debounce
      
      setDebounceTimer(timer);
    } else {
      setStops([]);
      setShowDropdown(false);
    }

    // Cleanup function
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [query, selectedStop]);

  const searchStops = async (searchText: string) => {
    try {
      setLoading(true);
      const response = await PassengerApIsService.searchStops(
        undefined, // name
        undefined, // city
        searchText, // searchText
        undefined, // accessibleOnly
        0, // page
        10 // size - limit to 10 results for dropdown
      );
      
      setStops(response.content || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching stops:', error);
      setStops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStopSelect = (stop: PassengerStopResponse) => {
    setSelectedStop(stop);
    setQuery(stop.name || '');
    setStops([]);
    setShowDropdown(false);
    onStopSelect(stop);
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    // Clear selection if user types something different
    if (selectedStop && text !== selectedStop.name) {
      setSelectedStop(null);
    }
  };

  const handleFocus = () => {
    // Only show dropdown if we have search results and no stop is selected
    if (stops.length > 0 && !selectedStop) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow for tap events
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <MapPin size={16} color="#6B7280" />
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            value={query}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCapitalize="words"
          />
          {loading && (
            <ActivityIndicator size="small" color="#004CFF" />
          )}
        </View>
        
        {showDropdown && stops.length > 0 && (
          <View style={styles.dropdown}>
            <ScrollView
              style={styles.dropdownList}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {stops.map((item) => (
                <TouchableOpacity
                  key={item.stopId || item.name || ''}
                  style={styles.dropdownItem}
                  onPress={() => handleStopSelect(item)}
                  activeOpacity={0.7}
                >
                  <MapPin size={16} color="#6B7280" />
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{item.name}</Text>
                    {item.city && <Text style={styles.stopCity}>{item.city}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  inputContainer: {
    position: 'relative',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stopName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  stopCity: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
});