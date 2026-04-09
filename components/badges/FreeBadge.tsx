import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

type Props = { size?: 'sm' | 'md' | 'lg' };

export function FreeBadge({ size = 'md' }: Props) {
  const px = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const py = size === 'sm' ? 3 : size === 'lg' ? 6 : 4;
  const fs = size === 'sm' ? 9 : size === 'lg' ? 12 : 10;
  return (
    <View style={[styles.badge, { paddingHorizontal: px, paddingVertical: py }]}>
      <Text style={[styles.text, { fontSize: fs }]}>GRATUITO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
  },
  text: {
    fontFamily: 'PublicSans-Black',
    color: colors.onPrimaryFixed,
    letterSpacing: 1.5,
  },
});
