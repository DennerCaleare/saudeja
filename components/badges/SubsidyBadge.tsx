import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

type Props = { desconto?: number };

export function SubsidyBadge({ desconto }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{desconto ? `${desconto}% OFF` : 'SUBSIDIADO'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    fontFamily: 'PublicSans-Black',
    fontSize: 9,
    color: colors.secondary,
    letterSpacing: 1.2,
  },
});
