import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Action = {
  label: string;
  icon: any;
  onPress: () => void;
};

type Props = {
  actions: Action[];
};

export default function QuickActions({ actions }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        {actions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.actionButton, styles.blueButton]}
            onPress={action.onPress}
          >
            <Ionicons name={action.icon} size={24} color="white" />
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginBottom: 24,
  },
  actionButton: {
    width: '46%',
    margin: '2%',
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueButton: {
    backgroundColor: '#0066FF',
  },
  actionText: {
    color: 'white',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
  },
});