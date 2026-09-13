import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from './ProfileAvatar';
import { useMyPhoto, type PhotoSource } from '@/hooks/profile/useMyPhoto';

interface EditableProfilePhotoProps {
  name?: string;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * The signed-in conductor's photo with the control to change it (INC-007).
 *
 * The choice between camera and library is an in-app modal rather than a native alert, because a
 * native alert does nothing in the web preview this is verified in, and the modal behaves the same
 * on a phone.
 */
export function EditableProfilePhoto({ name, size = 120, containerStyle }: EditableProfilePhotoProps) {
  const { photoUri, uploading, error, clearError, changePhoto } = useMyPhoto();
  const [choosing, setChoosing] = useState(false);

  async function pick(source: PhotoSource) {
    setChoosing(false);
    await changePhoto(source);
  }

  return (
    <View style={containerStyle}>
      <View style={styles.avatarWrapper}>
        <ProfileAvatar photoUri={photoUri} name={name} size={size} />

        <TouchableOpacity
          style={styles.cameraButton}
          disabled={uploading}
          accessibilityLabel="Change profile photo"
          accessibilityRole="button"
          onPress={() => {
            clearError();
            setChoosing(true);
          }}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="camera" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={choosing} transparent animationType="fade" onRequestClose={() => setChoosing(false)}>
        <Pressable style={styles.backdrop} onPress={() => setChoosing(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Change profile photo</Text>

            <TouchableOpacity style={styles.sheetOption} onPress={() => pick('camera')} accessibilityRole="button">
              <Ionicons name="camera-outline" size={22} color="#0066FF" />
              <Text style={styles.sheetOptionText}>Take a photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => pick('library')} accessibilityRole="button">
              <Ionicons name="images-outline" size={22} color="#0066FF" />
              <Text style={styles.sheetOptionText}>Choose from library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.sheetOption, styles.cancel]} onPress={() => setChoosing(false)} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarWrapper: { position: 'relative' },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#0066FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  error: { color: '#C62828', fontSize: 12, textAlign: 'center', marginTop: 8, maxWidth: 240 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  sheetOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 8 },
  sheetOptionText: { fontSize: 16, color: '#111' },
  cancel: { justifyContent: 'center', marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E0E0E0' },
  cancelText: { fontSize: 16, color: '#666', fontWeight: '600' },
});
