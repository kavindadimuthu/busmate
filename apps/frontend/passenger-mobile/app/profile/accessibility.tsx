import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Globe,
  Type,
  Volume2,
  Eye,
  Check,
  ChevronRight,
  Moon
} from 'lucide-react-native';
import AppHeader from '@/components/ui/AppHeader';

export default function AccessibilityScreen() {
  const router = useRouter();
  
  // Language and accessibility settings
  const [settings, setSettings] = useState({
    language: 'English',
    textSize: 'Medium',
    darkMode: false,
    reduceMotion: false,
    voiceNavigation: false,
    highContrast: false
  });

  // Available languages
  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Sinhala', code: 'si' },
    { name: 'Tamil', code: 'ta' }
  ];

  // Text size options
  const textSizes = ['Small', 'Medium', 'Large', 'Extra Large'];

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showTextSizeSelector, setShowTextSizeSelector] = useState(false);

  const toggleDarkMode = () => {
    setSettings(prev => ({
      ...prev,
      darkMode: !prev.darkMode
    }));
  };

  const toggleReduceMotion = () => {
    setSettings(prev => ({
      ...prev,
      reduceMotion: !prev.reduceMotion
    }));
  };

  const toggleVoiceNavigation = () => {
    setSettings(prev => ({
      ...prev,
      voiceNavigation: !prev.voiceNavigation
    }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({
      ...prev,
      highContrast: !prev.highContrast
    }));
  };

  const selectLanguage = (language) => {
    setSettings(prev => ({ ...prev, language }));
    setShowLanguageSelector(false);
  };

  const selectTextSize = (size) => {
    setSettings(prev => ({ ...prev, textSize: size }));
    setShowTextSizeSelector(false);
  };

  const saveSettings = () => {
    // Simulate API call
    Alert.alert(
      "Settings Saved", 
      "Your accessibility and language preferences have been updated.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Language & Accessibility" />

      <ScrollView style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Globe size={24} color="#004CFF" />
          </View>
          <Text style={styles.infoTitle}>Personalize Your Experience</Text>
          <Text style={styles.infoText}>
            Customize language, text size, and accessibility settings to make the app work better for you.
          </Text>
        </View>

        {/* Language Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Language Settings</Text>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.optionItemLast]}
            onPress={() => setShowLanguageSelector(!showLanguageSelector)}
          >
            <View style={styles.optionInfo}>
              <Globe size={20} color="#004CFF" />
              <Text style={styles.optionText}>App Language</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.language}</Text>
              <ChevronRight size={16} color="#6B7280" />
            </View>
          </TouchableOpacity>

          {showLanguageSelector && (
            <View style={styles.expandedOptions}>
              {languages.map((lang) => (
                <TouchableOpacity 
                  key={lang.code}
                  style={styles.expandedOption}
                  onPress={() => selectLanguage(lang.name)}
                >
                  <Text style={styles.expandedOptionText}>{lang.name}</Text>
                  {settings.language === lang.name && (
                    <Check size={16} color="#004CFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Text Size Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Text Settings</Text>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.optionItemLast]}
            onPress={() => setShowTextSizeSelector(!showTextSizeSelector)}
          >
            <View style={styles.optionInfo}>
              <Type size={20} color="#004CFF" />
              <Text style={styles.optionText}>Text Size</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.valueText}>{settings.textSize}</Text>
              <ChevronRight size={16} color="#6B7280" />
            </View>
          </TouchableOpacity>

          {showTextSizeSelector && (
            <View style={styles.expandedOptions}>
              {textSizes.map((size) => (
                <TouchableOpacity 
                  key={size}
                  style={styles.expandedOption}
                  onPress={() => selectTextSize(size)}
                >
                  <Text style={styles.expandedOptionText}>{size}</Text>
                  {settings.textSize === size && (
                    <Check size={16} color="#004CFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Display & Accessibility Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Display & Accessibility</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={toggleDarkMode}
          >
            <View style={styles.optionInfo}>
              <Moon size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Dark Mode</Text>
                <Text style={styles.optionSubtext}>Reduce eye strain in low light</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              settings.darkMode && styles.toggleButtonActive
            ]}>
              {settings.darkMode && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={toggleReduceMotion}
          >
            <View style={styles.optionInfo}>
              <Globe size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Reduce Motion</Text>
                <Text style={styles.optionSubtext}>Minimize animations throughout app</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              settings.reduceMotion && styles.toggleButtonActive
            ]}>
              {settings.reduceMotion && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={toggleVoiceNavigation}
          >
            <View style={styles.optionInfo}>
              <Volume2 size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>Voice Navigation</Text>
                <Text style={styles.optionSubtext}>Audio descriptions for navigation</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              settings.voiceNavigation && styles.toggleButtonActive
            ]}>
              {settings.voiceNavigation && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionItem, styles.optionItemLast]}
            onPress={toggleHighContrast}
          >
            <View style={styles.optionInfo}>
              <Eye size={20} color="#004CFF" />
              <View>
                <Text style={styles.optionText}>High Contrast</Text>
                <Text style={styles.optionSubtext}>Increase visibility of text and elements</Text>
              </View>
            </View>
            <View style={[
              styles.toggleButton,
              settings.highContrast && styles.toggleButtonActive
            ]}>
              {settings.highContrast && <Check size={16} color="white" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Some settings may require restarting the app to take full effect.
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={saveSettings}
          style={styles.saveButton}
        >
          <Check size={20} color="white" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F9',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#EBF2FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  optionItemLast: {
    borderBottomWidth: 0,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
  },
  optionSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 16,
    color: '#6B7280',
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#004CFF',
    borderColor: '#004CFF',
  },
  expandedOptions: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  expandedOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  noteContainer: {
    paddingHorizontal: 16,
    marginBottom: 120,
  },
  noteText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#004CFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});