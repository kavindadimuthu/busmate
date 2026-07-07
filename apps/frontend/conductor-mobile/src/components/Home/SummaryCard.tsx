import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  backgroundColor?: string;
  style?: ViewStyle;
};

export default function SummaryCard({ icon, value, label, backgroundColor = '#e6efff', style }: Props) {
  return (
    <View style={[styles.summaryCard, style]}>
      <View style={[styles.summaryIconContainer, { backgroundColor }]}>
        {icon}
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
});