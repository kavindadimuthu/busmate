import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar, Clock, Users } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FilterOptionsType {
  travelDate: Date;
  departureTimeFrom?: string;
  departureTimeTo?: string;
  operatorType?: 'PRIVATE' | 'CTB';
  operatorId?: string;
  status?: 'pending' | 'active' | 'completed' | 'cancelled' | 'delayed' | 'in_transit' | 'boarding' | 'departed';
  passengers: number;
}

interface RouteFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filterOptions: FilterOptionsType;
  onApplyFilters: (filters: FilterOptionsType) => void;
}

export default function RouteFilterModal({
  visible,
  onClose,
  filterOptions: initialFilters,
  onApplyFilters,
}: RouteFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptionsType>(initialFilters);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);

  useEffect(() => {
    setLocalFilters(initialFilters);
  }, [initialFilters]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setLocalFilters(prev => ({
        ...prev,
        travelDate: selectedDate
      }));
    }
  };

  const handleFromTimeChange = (event: any, selectedTime?: Date) => {
    setShowFromTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      setLocalFilters(prev => ({
        ...prev,
        departureTimeFrom: timeString
      }));
    }
  };

  const handleToTimeChange = (event: any, selectedTime?: Date) => {
    setShowToTimePicker(false);
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      setLocalFilters(prev => ({
        ...prev,
        departureTimeTo: timeString
      }));
    }
  };

  const handleOperatorTypeChange = (operatorType: 'PRIVATE' | 'CTB' | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      operatorType: operatorType === prev.operatorType ? undefined : operatorType
    }));
  };

  const handlePassengerChange = (increment: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      passengers: increment 
        ? Math.min(prev.passengers + 1, 10) 
        : Math.max(prev.passengers - 1, 1)
    }));
  };

  const clearTimeFilters = () => {
    setLocalFilters(prev => ({
      ...prev,
      departureTimeFrom: undefined,
      departureTimeTo: undefined
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptionsType = {
      travelDate: new Date(),
      departureTimeFrom: undefined,
      departureTimeTo: undefined,
      operatorType: undefined,
      operatorId: undefined,
      status: undefined,
      passengers: 1
    };
    setLocalFilters(resetFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Filter Routes</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Travel Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#004CFF" />
              <Text style={styles.dateText}>
                {localFilters.travelDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Departure Time */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Departure Time</Text>
              {(localFilters.departureTimeFrom || localFilters.departureTimeTo) && (
                <TouchableOpacity onPress={clearTimeFilters}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.timeFiltersContainer}>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowFromTimePicker(true)}
              >
                <Clock size={18} color="#6B7280" />
                <Text style={styles.timeButtonText}>
                  From: {localFilters.departureTimeFrom || 'Any time'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowToTimePicker(true)}
              >
                <Clock size={18} color="#6B7280" />
                <Text style={styles.timeButtonText}>
                  To: {localFilters.departureTimeTo || 'Any time'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Operator Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Operator Type</Text>
            <View style={styles.operatorContainer}>
              <TouchableOpacity
                style={[
                  styles.operatorButton,
                  localFilters.operatorType === 'PRIVATE' && styles.operatorButtonActive
                ]}
                onPress={() => handleOperatorTypeChange('PRIVATE')}
              >
                <Text style={[
                  styles.operatorButtonText,
                  localFilters.operatorType === 'PRIVATE' && styles.operatorButtonTextActive
                ]}>
                  Private
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.operatorButton,
                  localFilters.operatorType === 'CTB' && styles.operatorButtonActive
                ]}
                onPress={() => handleOperatorTypeChange('CTB')}
              >
                <Text style={[
                  styles.operatorButtonText,
                  localFilters.operatorType === 'CTB' && styles.operatorButtonTextActive
                ]}>
                  CTB
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Passengers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Passengers</Text>
            <View style={styles.passengerContainer}>
              <TouchableOpacity
                style={styles.passengerButton}
                onPress={() => handlePassengerChange(false)}
              >
                <Text style={styles.passengerButtonText}>-</Text>
              </TouchableOpacity>
              
              <View style={styles.passengerDisplay}>
                <Users size={18} color="#6B7280" />
                <Text style={styles.passengerText}>{localFilters.passengers}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.passengerButton}
                onPress={() => handlePassengerChange(true)}
              >
                <Text style={styles.passengerButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={localFilters.travelDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Time Pickers */}
        {showFromTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onChange={handleFromTimeChange}
          />
        )}

        {showToTimePicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            display="default"
            onChange={handleToTimeChange}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  clearText: {
    fontSize: 14,
    color: '#004CFF',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  timeFiltersContainer: {
    gap: 12,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  operatorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  operatorButton: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  operatorButtonActive: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  operatorButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  operatorButtonTextActive: {
    color: 'white',
  },
  passengerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passengerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  passengerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#004CFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});