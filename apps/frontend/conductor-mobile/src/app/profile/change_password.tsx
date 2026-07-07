import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ChangePasswordScreen() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  const [passwordVisibility, setPasswordVisibility] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [requirements, setRequirements] = useState({
    minLength: false,
    differentFromCurrent: false
  });

  // Update password requirements validation whenever passwords change
  useEffect(() => {
    setRequirements({
      minLength: passwords.new.length >= 8,
      differentFromCurrent: passwords.new !== passwords.current || passwords.new === ''
    });
  }, [passwords.new, passwords.current]);

  type PasswordField = 'current' | 'new' | 'confirm';

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordChange = (field: PasswordField, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePassword = () => {
    // Validate all requirements before updating
    if (!requirements.minLength || !requirements.differentFromCurrent) {
      Alert.alert('Error', 'Please meet all password requirements');
      return;
    }
    
    if (passwords.new !== passwords.confirm) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (passwords.current === '') {
      Alert.alert('Error', 'Current password is required');
      return;
    }

    // Password update logic would go here
    console.log('Updating password');
    
    // Navigate back after successful update
    Alert.alert('Success', 'Password updated successfully', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.emptySpace} />
      </View> */}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
          {/* Current Password */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwords.current}
                onChangeText={(text) => handlePasswordChange('current', text)}
                placeholder="Enter current password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisibility.current}
              />
              <TouchableOpacity 
                style={styles.visibilityToggle}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Ionicons 
                  name={passwordVisibility.current ? "eye-off" : "eye"} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* New Password */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwords.new}
                onChangeText={(text) => handlePasswordChange('new', text)}
                placeholder="Enter new password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisibility.new}
              />
              <TouchableOpacity 
                style={styles.visibilityToggle}
                onPress={() => togglePasswordVisibility('new')}
              >
                <Ionicons 
                  name={passwordVisibility.new ? "eye-off" : "eye"} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Confirm New Password */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={passwords.confirm}
                onChangeText={(text) => handlePasswordChange('confirm', text)}
                placeholder="Confirm new password"
                placeholderTextColor="#A0A0A0"
                secureTextEntry={!passwordVisibility.confirm}
              />
              <TouchableOpacity 
                style={styles.visibilityToggle}
                onPress={() => togglePasswordVisibility('confirm')}
              >
                <Ionicons 
                  name={passwordVisibility.confirm ? "eye-off" : "eye"} 
                  size={24} 
                  color="#999" 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            
            <View style={styles.requirementItem}>
              <Ionicons 
                name={requirements.minLength ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={20} 
                color={requirements.minLength ? "#22C55E" : "#999"} 
              />
              <Text style={[
                styles.requirementText,
                requirements.minLength ? styles.metRequirement : null
              ]}>
                At least 8 characters long
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons 
                name={requirements.differentFromCurrent ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={20} 
                color={requirements.differentFromCurrent ? "#22C55E" : "#999"} 
              />
              <Text style={[
                styles.requirementText,
                requirements.differentFromCurrent ? styles.metRequirement : null
              ]}>
                Different from current password
              </Text>
            </View>
          </View>
          
          {/* Update Button */}
          <TouchableOpacity 
            style={styles.updateButton} 
            onPress={handleUpdatePassword}
          >
            <Text style={styles.updateButtonText}>Update Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
  },
  emptySpace: {
    width: 28,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#333',
  },
  visibilityToggle: {
    padding: 8,
  },
  requirementsContainer: {
    backgroundColor: '#EBF5FF',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  metRequirement: {
    color: '#0066FF',
  },
  updateButton: {
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});