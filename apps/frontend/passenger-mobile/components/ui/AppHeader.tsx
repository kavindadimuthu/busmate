import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
  statusBarStyle?: 'light-content' | 'dark-content';
}

export default function AppHeader({ 
  title, 
  showBackButton = true, 
  rightElement,
  onBackPress,
  statusBarStyle = 'light-content'
}: AppHeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor="#004CFF" translucent={false} />
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        {rightElement || <View style={{ width: 40 }} />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#004CFF',
    borderBottomWidth: 1,
    borderBottomColor: '#003CC7',
    // Add proper status bar height for Android
    ...(Platform.OS === 'android' ? {
      // paddingTop: 0 + (StatusBar.currentHeight || 0)
    } : {})
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});