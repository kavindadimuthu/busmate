import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export const useSafeAreaStyles = () => {
  const insets = useSafeAreaInsets();

  return {
    paddingTop: Platform.OS === 'android' ? insets.top : 0,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };
};

export const useStatusBarHeight = () => {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'android' ? insets.top : 0;
};

// Safe area container - only handles safe area without background color
export const useSafeAreaContainerStyles = () => {
  const insets = useSafeAreaInsets();

  return {
    flex: 1,
    backgroundColor: '#F3F4F9', // Default light background for content
    paddingTop: Platform.OS === 'android' ? insets.top : 0,
  };
};

// Status bar background styles (blue background for status bar area only)
export const useStatusBarBackgroundStyles = () => {
  const insets = useSafeAreaInsets();

  return {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? insets.top : 0,
    backgroundColor: '#004CFF', // Primary blue background for status bar area
    zIndex: 1000,
  };
};

// Content container styles (white background for main content)
export const useContentContainerStyles = () => {
  return {
    flex: 1,
    backgroundColor: '#F3F4F9', // Default light background for content
  };
};