import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useSafeAreaContainerStyles } from '@/hooks/useSafeAreaStyles';

interface Language {
  code: string;
  name: string;
  localName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', localName: 'English' },
  { code: 'si', name: 'Sinhala', localName: 'සිංහල' },
  { code: 'ta', name: 'Tamil', localName: 'தமிழ்' },
];

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const router = useRouter();
  const safeAreaStyle = useSafeAreaContainerStyles();

  const handleContinue = () => {
    // Here you would save the selected language to storage
    router.push('/onboarding/onboarding1');
  };

  return (
    <>
      <StatusBar backgroundColor="#004CFF" barStyle="light-content" />
      <SafeAreaView style={safeAreaStyle}>
        <View className="flex-1 px-6 py-8">
          <View className="flex-1 justify-center h-full mb-20">
            <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
              Choose Your Language
            </Text>
            <Text className="text-lg text-gray-600 text-center mb-12">
              Select your preferred language to continue
            </Text>

            <View className="space-y-4">
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  onPress={() => setSelectedLanguage(language.code)}
                  className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${selectedLanguage === language.code
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white'
                    }`}
                >
                  <View>
                    <Text className="text-lg font-semibold text-gray-900">
                      {language.name}
                    </Text>
                    <Text className="text-base text-gray-600">
                      {language.localName}
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                      <Check size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleContinue}
            className="bg-primary py-4 rounded-xl items-center"
          >
            <Text className="text-white text-lg font-semibold">Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}