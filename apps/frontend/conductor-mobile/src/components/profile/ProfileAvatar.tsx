import React from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

interface ProfileAvatarProps {
  photoUri: string | null;
  /** Used for the initials shown when there is no photo. */
  name?: string;
  size: number;
  style?: StyleProp<ViewStyle>;
}

function initialsOf(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/**
 * A conductor's photo, or their initials when they have none (INC-007). Never a stock portrait:
 * showing a stranger's face as the signed-in conductor is the defect this replaced.
 */
export function ProfileAvatar({ photoUri, name, size, style }: ProfileAvatarProps) {
  const round = { width: size, height: size, borderRadius: size / 2 };

  if (photoUri) {
    // The caller's style describes a circle either way; Image and View disagree only in type.
    return (
      <Image
        source={{ uri: photoUri }}
        style={[round, style] as StyleProp<ImageStyle>}
        accessibilityLabel={name ? `${name}'s photo` : 'Profile photo'}
      />
    );
  }

  return (
    <View style={[round, styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#D6E4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#0066FF',
    fontWeight: '700',
  },
});
