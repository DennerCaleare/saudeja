import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

type Props = { rename?: boolean };

export function SUSBadge({ rename = false }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{rename ? 'RENAME' : 'SUS'}</Text>
    </View>
  );
}

export function RENAMEBadge() {
  return <SUSBadge rename />;
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontFamily: 'PublicSans-Black',
    fontSize: 9,
    color: colors.onSecondaryContainer,
    letterSpacing: 1.5,
  },
});
